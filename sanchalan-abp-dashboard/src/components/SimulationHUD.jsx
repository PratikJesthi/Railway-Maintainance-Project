import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function SimulationHUD() {
  const { simSummaryReport, setSimSummaryReport } = useApp();

  if (!simSummaryReport) return null;

  return (
    <div className="mt-5 border border-[#26364D] bg-[#101B2D] text-slate-200 rounded-md p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#26364D] mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-white font-display">24h Simulation Report</h3>
          <p className="text-[11.5px] text-slate-400 font-medium font-sans">
            Summary of operations run, CP-SAT solver executions, and ML delay mitigations.
          </p>
        </div>
        <button
          onClick={() => setSimSummaryReport(null)}
          className="text-[11.5px] font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-md bg-[#0B1424] border border-[#26364D] hover:bg-[#142238] transition-colors font-mono"
        >
          ✕ CLOSE
        </button>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-4">
        <StatCard label="Completed Blocks" value={`${simSummaryReport.completedBlocks} closed`} />
        <StatCard label="Injected Defects" value={`${simSummaryReport.injectedDefects} auto-planned`} />
        <StatCard label="CP-SAT Solver Runs" value={`${simSummaryReport.optimizerRuns} runs`} />
        <StatCard label="ML Cascade Prevented" value={`+${simSummaryReport.cascadeSavedMins} mins`} highlight />
      </div>

      {/* Chronological Event Log */}
      {simSummaryReport.events?.length > 0 && (
        <div className="bg-[#050B16] border border-[#26364D] rounded-md p-4">
          <div className="text-[11px] font-bold text-[#06B6D4] uppercase tracking-wider mb-2.5 font-mono">
            Simulation Timeline Log
          </div>
          <div className="space-y-1.5 text-[11.5px] font-mono max-h-48 overflow-y-auto">
            {simSummaryReport.events.map((ev, i) => (
              <div key={i} className="flex gap-3 text-slate-300 py-1 border-b border-[#26364D]/50 last:border-b-0">
                <span className="text-[#06B6D4] font-bold shrink-0 min-w-[64px]">H+{Math.round(ev.hour)}h:</span>
                <span className="font-sans font-normal text-slate-300">{ev.text}</span>
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
    <div className="bg-[#0B1424] border border-[#26364D] p-3.5 rounded-md">
      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider font-mono">{label}</span>
      <span className={`text-[15px] font-bold num ${highlight ? 'text-[#06B6D4]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

