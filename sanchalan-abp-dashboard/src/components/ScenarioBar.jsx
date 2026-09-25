import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fmtWindow } from '../utils.js';
import { apiJson } from '../api/client.js';

const TYPE_BADGE = {
  SF:   { bg: 'bg-cyan-900/60',   text: 'text-cyan-300',   label: 'SF'   },
  EXP:  { bg: 'bg-blue-900/60',   text: 'text-blue-300',   label: 'EXP'  },
  RAJ:  { bg: 'bg-amber-900/60',  text: 'text-amber-300',  label: 'RAJ'  },
  PASS: { bg: 'bg-ink-700/60',    text: 'text-cream-400',  label: 'PASS' },
  MEMU: { bg: 'bg-emerald-900/60',text: 'text-emerald-300',label: 'MEMU' },
  DEMU: { bg: 'bg-purple-900/60', text: 'text-purple-300', label: 'DEMU' },
};

function TypeBadge({ type }) {
  const s = TYPE_BADGE[type] || TYPE_BADGE.PASS;
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function Row({ k, v, bad, good }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-cream-300/70">{k}</span>
      <span className={'num ' + (bad ? 'text-red-300' : good ? 'text-emerald-300' : 'text-cream-50')}>{v}</span>
    </div>
  );
}

export default function ScenarioBar() {
  const { scenario, applyScenario, discardScenario, depts: DEPTS } = useApp();
  const [affectedData, setAffectedData] = useState(null);
  const [cascadeData, setCascadeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scenario?.id) {
      setAffectedData(null);
      setCascadeData(null);
      return;
    }
    setLoading(true);

    // Fetch affected trains
    apiJson(`/api/trains/affected?block_id=${encodeURIComponent(scenario.id)}`)
      .then(d => setAffectedData(d))
      .catch(() => setAffectedData(null))
      .finally(() => setLoading(false));

    // Fetch ML Cascade Delay Prediction based on shift duration (seconds)
    const delaySec = Math.max(300, Math.round(Math.abs(scenario.delayH || scenario.dur) * 3600));
    apiJson(`/api/trains/cascade-impact?delay_received_seconds=${delaySec}&propagation_depth=1&is_root=false`)
      .then(c => setCascadeData(c))
      .catch(() => setCascadeData(null));

  }, [scenario?.id, scenario?.delayH, scenario?.dur]);

  if (!scenario) return null;

  const dept = DEPTS[scenario.dept];
  const delayH = scenario.delayH ?? 0;
  const slaText =
    delayH > 0
      ? `delayed ${delayH}h → est. +${Math.max(1, Math.round(delayH / 24))} overdue day`
      : delayH < 0
      ? `pulled earlier ${-delayH}h ✓`
      : 'no schedule shift';

  const conflictIds = scenario.conflictIds || [];
  const delta = scenario.delta ?? 0;

  const affectedCount = affectedData?.affected_count ?? null;
  const affectedTrains = affectedData?.trains ?? [];
  const affectedText = loading
    ? 'querying…'
    : affectedCount === null
      ? '—'
      : affectedCount === 0
        ? 'none in window ✓'
        : `${affectedCount} train${affectedCount !== 1 ? 's' : ''}`;

  return (
    <div className="fixed left-1/2 bottom-5 -translate-x-1/2 w-[min(760px,96vw)] bg-ink-900 border border-ink-700 rounded-xl shadow-panel z-[60] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded bg-amber-900/70 text-amber-300">
          WHAT-IF
        </span>
        <span className="text-[12px] text-cream-50">
          Move <b>{scenario.id}</b> ({scenario.sec} · {dept?.name}) →{' '}
          <span className="num">{fmtWindow(scenario.newStart, scenario.dur)}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11.5px] mb-3">
        <Row k="Conflicts after move" v={conflictIds.length ? conflictIds.join(', ') : 'none ✓'} bad={conflictIds.length > 0} good={!conflictIds.length} />
        <Row k="Conflict delta" v={`${delta > 0 ? '+' : ''}${delta} ${delta > 0 ? '⚠' : '✓'}`} bad={delta > 0} good={delta <= 0} />
        <Row k="SLA impact" v={slaText} />
        <Row
          k="Trains affected (real)"
          v={affectedText}
          bad={affectedCount > 0}
          good={affectedCount === 0}
        />
      </div>

      {/* ML Cascade Delay Predictor Box */}
      {cascadeData && (
        <div className="mb-3 px-3.5 py-2.5 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-800/50 rounded-lg flex items-center justify-between text-[11.5px]">
          <div className="flex items-center gap-2">
            <span className="text-[13px]">⚡</span>
            <div>
              <span className="font-semibold text-purple-200">ML Cascade Delay Prediction: </span>
              <span className="text-purple-300">
                +{cascadeData.predicted_propagated_delay_minutes} mins ({cascadeData.predicted_propagated_delay_seconds.toFixed(0)}s) downstream network delay
              </span>
            </div>
          </div>
          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/40">
            R²=0.9289 · 171k events
          </span>
        </div>
      )}

      {/* Affected train mini-table */}
      {affectedTrains.length > 0 && (
        <div className="mb-3 border border-ink-700 rounded-lg overflow-hidden">
          <div className="bg-ink-800 px-3 py-1.5 text-[10px] font-bold tracking-wide text-amber-300 uppercase">
            Path-holds in block window — {affectedData.sec}
          </div>
          <div className="divide-y divide-ink-700/50">
            {affectedTrains.map(t => (
              <div key={`${t.train_number}-${t.pass_start_h}`}
                   className="flex items-center gap-3 px-3 py-1.5 text-[11px] hover:bg-ink-800/40 transition-colors">
                <span className="font-mono text-cream-300/60 w-12">{t.train_number}</span>
                <TypeBadge type={t.train_type} />
                <span className="flex-1 text-cream-100 truncate">{t.train_name}</span>
                <span className="text-cream-300/50 text-[10px] shrink-0">{t.from_name} → {t.to_name}</span>
                <span className="text-red-300 text-[10px] font-mono shrink-0 ml-1">
                  {t.overlap_h.toFixed(1)}h overlap
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => discardScenario(false)}
          className="text-[11.5px] px-3.5 py-1.5 rounded-md bg-ink-700/60 text-cream-100 hover:bg-ink-700"
        >
          Discard
        </button>
        <button
          onClick={applyScenario}
          className="text-[11.5px] px-3.5 py-1.5 rounded-md text-white font-medium hover:opacity-90"
          style={{ background: '#3E8E5B' }}
        >
          ✓ Apply scenario
        </button>
      </div>
    </div>
  );
}
