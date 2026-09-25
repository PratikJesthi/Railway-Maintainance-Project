import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { SECTIONS } from '../../data/opsData';
import Card from '../ui/Card.jsx';
import RailwayCorridorMap from '../ui/RailwayCorridorMap.jsx';

function KpiCard({ k, aiMode }) {
  const display = aiMode ? k.ai_display : k.man_display;
  return (
    <Card className="p-5 bg-[#101B2D]/85 backdrop-blur-md border border-[#26364D]">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2.5 font-mono">{k.label}</div>
      <div className="num text-[32px] leading-none font-bold text-white tracking-tight">{display}</div>
      <div className="mt-3 flex items-center gap-2 text-[12px]">
        <span className="num font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full text-[11px]">
          {k.delta}
        </span>
        <span className="text-slate-400 text-[11px] font-medium">{aiMode ? 'AI plan' : 'manual baseline'}</span>
      </div>
    </Card>
  );
}

function utilFor(sec, blocks) {
  const total = blocks.filter((b) => b.sec === sec).reduce((s, b) => s + b.dur, 0);
  const pct = Math.min(100, Math.round((total / 40) * 100));
  return pct;
}

export default function CommandCentre() {
  const { aiMode, blocks, feed, kpis, setScreen } = useApp();
  const hasConflict = blocks.some((b) => b.conflict);

  return (
    <div className="screen-enter space-y-4">
      {/* Top Row Primary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={i} k={k} aiMode={aiMode} />
        ))}
      </div>

      {hasConflict && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-md border border-red-700/60 bg-red-950/40 text-[12px]">
          <div className="w-7 h-7 rounded-full bg-red-900/60 text-red-400 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 3L2 20h20L12 3z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
          </div>
          <span className="text-slate-200">
            <b className="text-red-300 font-semibold font-mono">2 OVERLAPPING BLOCK REQUESTS DETECTED</b> on AGC–GWL
            corridor · suggested resolution ready on the Conflict screen
          </span>
          <button
            onClick={() => setScreen('conflict')}
            className="ml-auto text-[12px] font-semibold font-mono bg-red-900/60 text-red-200 border border-red-700/60 px-3.5 py-1.5 rounded-md hover:bg-red-800/60 transition-all"
          >
            Review →
          </button>
        </div>
      )}

      {/* Railway Corridor Network Map */}
      <RailwayCorridorMap />

      {/* Middle Section: Utilisation + Live Feed */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 relative">
        <Card className="relative overflow-hidden bg-[#101B2D]/85 backdrop-blur-md">
          <div className="relative z-10 px-5 py-3.5 border-b border-[#26364D] flex items-center justify-between">
            <span className="text-[14px] font-bold text-slate-100 font-display">
              Block Utilisation by Corridor — this week
            </span>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#06B6D4]">block-hours / capacity</span>
          </div>
          <div className="relative z-10 p-5 space-y-4">
            {SECTIONS.map((sec) => {
              const pct = utilFor(sec, blocks);
              return (
                <div key={sec}>
                  <div className="flex justify-between text-[12.5px] font-medium mb-1.5">
                    <span className="text-slate-300 font-mono font-bold">{sec}</span>
                    <span className="num text-slate-400 font-semibold">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#050B16] border border-[#26364D] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, background: pct > 70 ? '#F59E0B' : '#06B6D4' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="bg-[#101B2D]">
          <div className="px-5 py-3.5 border-b border-[#26364D] flex items-center justify-between">
            <span className="text-[14px] font-bold text-slate-100 font-display">Live Ops Feed</span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#26364D]/60">
            {feed.map((f, i) => (
              <div key={i} className="flex gap-3 px-5 py-2.5 text-[12px] items-start hover:bg-[#0B1424] transition-colors">
                <span className="num text-[#06B6D4] text-[10.5px] pt-0.5 whitespace-nowrap font-mono">{f[0]}</span>
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: f[1] }} />
                <span className="text-slate-300 leading-snug font-normal">{f[2]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

