import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';
import RailwayCorridorMap from '../ui/RailwayCorridorMap.jsx';

export default function Overview() {
  const { blocks, feed, setScreen, aiMode } = useApp();
  const hasConflict = blocks.some((b) => b.conflict);

  const completedCount = blocks.filter((b) => b.st === 'Completed').length;
  const inProgressCount = blocks.filter((b) => b.st === 'In Progress').length;
  const scheduledCount = blocks.filter((b) => b.st === 'Scheduled' || b.st === 'Pending').length;

  return (
    <div className="screen-enter space-y-5">
      {/* Top SANCHALAN Operations Header Banner */}
      <div className="relative rounded-md border border-[#26364D] bg-[#0B1424]/85 backdrop-blur-md p-6 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#06B6D4] font-bold">
                CENTRAL RAILWAY OPERATIONS CONSOLE · NDLS → BPL CORRIDOR
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white font-display tracking-tight flex items-center gap-3">
              SANCHALAN — Automatic Block Planning
              <span className="text-[12px] font-mono bg-[#06B6D4]/15 text-[#06B6D4] px-2.5 py-0.5 rounded border border-[#06B6D4]/40 font-semibold">
                संचालन
              </span>
            </h1>
            <p className="text-[13px] text-slate-300 max-w-2xl mt-1.5 leading-relaxed font-normal">
              Real-time Indian Railways automatic block possession engine. Optimizing cross-departmental maintenance requests across Engineering (P.Way), Traction (OHE), and Signal &amp; Telecom (S&amp;T).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScreen('timeline')}
              className="bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-md text-[13px] font-mono shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 whitespace-nowrap"
            >
              OPEN CORRIDOR TIMELINE →
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Alert Banner */}
      {hasConflict && (
        <div className="flex items-center justify-between px-5 py-3.5 rounded-md border border-red-700/60 bg-red-950/40 text-[13px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-900/60 border border-red-700/40 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-red-300 font-mono">2 OVERLAPPING BLOCK REQUESTS DETECTED ON AGC–GWL CORRIDOR</span>
              <div className="text-[12px] text-slate-400 mt-0.5 font-medium">
                Critical S&amp;T and Engineering overlap detected. Automated CP-SAT merge proposal ready.
              </div>
            </div>
          </div>
          <button
            onClick={() => setScreen('conflict')}
            className="bg-red-700 hover:bg-red-600 text-white font-bold font-mono text-[12px] px-4 py-2 rounded-md shadow-sm transition-all whitespace-nowrap"
          >
            REVIEW CONFLICT →
          </button>
        </div>
      )}

      {/* 4 Metric KPI Strips */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricStrip title="BLOCK-HOURS SECURED" value={aiMode ? "1,240 hrs" : "1,120 hrs"} badge="+10.7% vs baseline" icon="⏱️" color="#06B6D4" />
        <MetricStrip title="OVERDUE DEFECTS CLEARED" value="34 defects" badge="100% SLA target" icon="🔧" color="#10B981" />
        <MetricStrip title="CROSS-DEPT CONFLICTS" value={hasConflict ? "2 unresolved" : "0 conflicts"} badge={hasConflict ? "Action required" : "Clear corridor"} icon="⚠️" color={hasConflict ? "#EF4444" : "#10B981"} />
        <MetricStrip title="ASSET AVAILABILITY" value="98.4%" badge="3 tower wagons ready" icon="🏗️" color="#F59E0B" />
      </div>

      {/* Railway Corridor Network Map */}
      <RailwayCorridorMap />

      {/* Corridor Utilization + Live Stream */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#26364D] mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-white font-display">Corridor Possession Status &amp; Progress</h3>
              <p className="text-[12px] text-slate-400 font-medium">Active maintenance possessions per section</p>
            </div>
            <span className="text-[11px] font-mono text-[#06B6D4] bg-[#050B16] px-2.5 py-1 rounded border border-[#26364D] font-bold">
              NDLS → BPL Corridor
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#0B1424] p-3.5 rounded-md border border-[#26364D]">
              <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase mb-1">Active / In-Progress</span>
              <span className="text-2xl font-bold num text-emerald-400">{inProgressCount} Blocks</span>
            </div>
            <div className="bg-[#0B1424] p-3.5 rounded-md border border-[#26364D]">
              <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase mb-1">Scheduled Today</span>
              <span className="text-2xl font-bold num text-cyan-400">{scheduledCount} Blocks</span>
            </div>
            <div className="bg-[#0B1424] p-3.5 rounded-md border border-[#26364D]">
              <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase mb-1">Completed This Week</span>
              <span className="text-2xl font-bold num text-slate-200">{completedCount} Blocks</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { sec: 'NDLS–MTJ', code: 'SEC-01', dist: '141 km', status: 'Optimal', load: 65, color: '#10B981' },
              { sec: 'MTJ–AGC', code: 'SEC-02', dist: '54 km', status: 'Planned', load: 50, color: '#06B6D4' },
              { sec: 'AGC–GWL', code: 'SEC-03', dist: '118 km', status: 'Conflict Warning', load: 88, color: '#EF4444' },
              { sec: 'GWL–JHS', code: 'SEC-04', dist: '97 km', status: 'Work In Progress', load: 72, color: '#F59E0B' },
              { sec: 'JHS–BPL', code: 'SEC-05', dist: '291 km', status: 'S&T Activity', load: 58, color: '#8B5CF6' },
            ].map((item) => (
              <div key={item.sec} className="bg-[#0B1424] px-4 py-3 rounded-md border border-[#26364D] flex items-center justify-between text-[12.5px]">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}80` }} />
                  <div>
                    <span className="font-bold text-slate-100 font-mono text-[13px]">{item.sec}</span>
                    <span className="text-[11px] text-slate-400 ml-2 font-mono font-medium">({item.code} · {item.dist})</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-[#142238] h-2 rounded-full overflow-hidden border border-[#26364D]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${item.load}%`, background: item.color }} />
                  </div>
                  <span className="num font-bold text-slate-300 text-[12px] w-10 text-right">{item.load}%</span>
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full uppercase font-bold" style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Feed */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#26364D] mb-3.5">
            <h3 className="text-[15px] font-bold text-white font-display">Live Operations Feed</h3>
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE STREAM
            </span>
          </div>
          <div className="flex-1 max-h-[440px] overflow-y-auto space-y-0 divide-y divide-[#26364D]/60 pr-1">
            {feed.map((f, i) => (
              <div key={i} className="py-2.5 text-[12px] leading-relaxed flex gap-3 items-start hover:bg-[#0B1424] transition-colors px-1 rounded font-sans">
                <span className="num text-[10px] font-bold text-[#06B6D4] pt-0.5 whitespace-nowrap font-mono">{f[0]}</span>
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: f[1] }} />
                <span className="text-slate-300 font-normal">{f[2]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricStrip({ title, value, badge, icon, color }) {
  return (
    <Card className="p-4 relative overflow-hidden bg-[#101B2D]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="num text-[22px] font-bold text-white tracking-tight">{value}</div>
      <div className="mt-2 text-[11.5px] font-mono font-semibold" style={{ color }}>{badge}</div>
    </Card>
  );
}

