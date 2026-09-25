"""ML Cascade Delay Predictor (`app/services/cascade_predictor.py`)

Predicts downstream delay propagation (`delay_propagated_seconds`) across railway corridors
given initial disruption parameters, delay received, cascade depth, and corridor section.

Trained on 171,882 real cascade events in `v3_ground_truth.parquet`.
Data leakage prevention: GroupKFold split by `scenario_id` so entire disruption trees
stay intact in train vs validation folds.
"""

import os
import sys
import logging
import numpy as np
import pandas as pd

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "cascade_model.joblib")


def load_v3_dataset():
    candidates = [
        "/home/dds/rail/data/synthetic_v3/v3_ground_truth.parquet",
        "/app/data/synthetic_v3/v3_ground_truth.parquet",
        "../data/synthetic_v3/v3_ground_truth.parquet",
    ]
    v3_path = None
    for c in candidates:
        if os.path.exists(c):
            v3_path = c
            break

    if not v3_path:
        raise FileNotFoundError(f"v3_ground_truth.parquet not found in {candidates}")

    df = pd.read_parquet(v3_path)
    log.info("Loaded v3_ground_truth dataset from %s: %d rows", v3_path, len(df))
    return df


def prepare_cascade_features(df: pd.DataFrame):
    df["is_root"] = (df["causal_relationship"] == "ROOT_DISRUPTION").astype(int)
    df["delay_received"] = df["delay_received_seconds"].astype(float)
    df["depth"] = df["propagation_depth"].astype(float)

    # Frequency encoding for corridor resource_id
    res_freq = df["resource_id"].value_counts(normalize=True).to_dict()
    df["corridor_freq"] = df["resource_id"].map(res_freq).fillna(0.0)

    feature_cols = ["delay_received", "depth", "is_root", "corridor_freq"]
    X = df[feature_cols].astype(float)
    y = df["delay_propagated_seconds"].astype(float)
    groups = df["scenario_id"].astype(str)

    return df, X, y, groups, feature_cols


def train_and_evaluate_cascade_model():
    df = load_v3_dataset()
    df, X, y, groups, feature_cols = prepare_cascade_features(df)

    log.info("Splitting v3 dataset into GroupKFold (5 splits by scenario_id) to prevent disruption tree leakage...")
    gkf = GroupKFold(n_splits=5)

    rmse_list, mae_list, r2_list = [], [], []

    for fold, (train_idx, test_idx) in enumerate(gkf.split(X, y, groups=groups), 1):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42 + fold,
        )
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)

        rmse_list.append(rmse)
        mae_list.append(mae)
        r2_list.append(r2)
        log.info("Fold %d: RMSE=%.2fs, MAE=%.2fs, R2=%.4f", fold, rmse, mae, r2)

    log.info("=== v3 Cascade Model Cross-Validation Results ===")
    log.info("Mean RMSE: %.2fs (+/- %.2fs)", np.mean(rmse_list), np.std(rmse_list))
    log.info("Mean MAE:  %.2fs (+/- %.2fs)", np.mean(mae_list), np.std(mae_list))
    log.info("Mean R2:   %.4f (+/- %.4f)", np.mean(r2_list), np.std(r2_list))

    # Train final model on full dataset
    final_model = GradientBoostingRegressor(
        n_estimators=120,
        learning_rate=0.1,
        max_depth=5,
        random_state=42,
    )
    final_model.fit(X, y)

    importances = dict(zip(feature_cols, final_model.feature_importances_))
    log.info("=== Feature Importances ===")
    for k, v in sorted(importances.items(), key=lambda item: item[1], reverse=True):
        log.info("  %-20s: %.4f", k, v)

    # Sanity-check test cases
    log.info("=== Sanity Check Cascade Predictions ===")
    test_cases = pd.DataFrame([
        {"delay_received": 1800.0, "depth": 0.0, "is_root": 1, "corridor_freq": 0.01},  # 30 min root disruption
        {"delay_received": 1800.0, "depth": 2.0, "is_root": 0, "corridor_freq": 0.01},  # 30 min at hop 2
        {"delay_received": 600.0,  "depth": 1.0, "is_root": 0, "corridor_freq": 0.01},  # 10 min at hop 1
        {"delay_received": 300.0,  "depth": 4.0, "is_root": 0, "corridor_freq": 0.01},  # 5 min at hop 4
    ])
    preds_sanity = final_model.predict(test_cases[feature_cols])
    labels = ["30m Root Disruption (hop 0)", "30m Cascade (hop 2)", "10m Cascade (hop 1)", "5m Cascade (hop 4)"]
    for label, pred in zip(labels, preds_sanity):
        log.info("  %-30s -> Predicted Propagated Delay = %.1fs (%.1f mins)", label, pred, pred / 60.0)

    # Save model artifact
    joblib.dump({"model": final_model, "feature_cols": feature_cols}, MODEL_PATH)
    log.info("Saved trained Cascade Delay Predictor to %s", MODEL_PATH)
    return final_model


if __name__ == "__main__":
    train_and_evaluate_cascade_model()
