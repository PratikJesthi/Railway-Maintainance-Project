import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function SimulationHUD() {
  const { simSummaryReport, setSimSummaryReport } = useApp();

  if (!simSummaryReport) return null;

  return (
    <div className="mt-5 border border-cream-300 bg-white text-ink-900 rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-ink-900">
            24h Simulation Report
          </h3>
          <p className="text-[11px] text-ink-500">
            Summary of operations run, CP-SAT solver executions, and ML delay mitigations.
          </p>
        </div>

        <button
          onClick={() => setSimSummaryReport(null)}
          className="text-[11px] font-medium text-ink-600 hover:text-ink-900 px-2.5 py-1 rounded bg-cream-100 border border-cream-300 hover:bg-cream-200 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard label="Completed Blocks" value={`${simSummaryReport.completedBlocks} closed`} />
        <StatCard label="Injected Defects" value={`${simSummaryReport.injectedDefects} auto-planned`} />
        <StatCard label="CP-SAT Solver Runs" value={`${simSummaryReport.optimizerRuns} runs`} />
        <StatCard label="ML Cascade Prevented" value={`+${simSummaryReport.cascadeSavedMins} mins`} highlight />
      </div>

      {/* Chronological Event Log */}
      {simSummaryReport.events?.length > 0 && (
        <div className="bg-cream-50/70 border border-cream-200 rounded-md p-3.5">
          <div className="text-[10.5px] font-bold text-ink-700 uppercase tracking-wider mb-2">
            Simulation Timeline Log
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            {simSummaryReport.events.map((ev, i) => (
              <div key={i} className="flex gap-2.5 text-ink-800 py-1 border-b border-cream-200/60 last:border-b-0">
                <span className="text-teal-800 font-bold shrink-0 min-w-[60px]">H+{Math.round(ev.hour)}h:</span>
                <span>{ev.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="bg-cream-50 border border-cream-200 p-3 rounded-md">
      <span className="text-[9.5px] uppercase font-bold text-ink-500 block mb-0.5">{label}</span>
      <span className={`text-[13.5px] font-bold font-mono ${highlight ? 'text-teal-800' : 'text-ink-900'}`}>{value}</span>
    </div>
  );
}

