import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { SECTIONS } from '../../data/opsData';
import Card from '../ui/Card.jsx';

function KpiCard({ k, aiMode }) {
  const display = aiMode ? k.ai_display : k.man_display;
  return (
    <Card className="p-4">
      <div className="text-[11px] text-ink-500 mb-2">{k.label}</div>
      <div className="num text-[28px] font-semibold text-ink-900 tracking-tight">{display}</div>
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <span className="num font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
          {k.delta}
        </span>
        <span className="text-ink-500">{aiMode ? 'AI plan' : 'manual baseline'}</span>
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
    <div className="screen-enter">
      <div className="grid grid-cols-4 gap-3.5 mb-3.5">
        {kpis.map((k, i) => (
          <KpiCard key={i} k={k} aiMode={aiMode} />
        ))}
      </div>

      {hasConflict && (
        <div className="flex items-center gap-2.5 mb-3.5 px-3.5 py-2.5 rounded-lg border border-[#E7B9AC] bg-[#FBEEEA] text-[11.5px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#BB4430" strokeWidth="2.2">
            <path d="M12 3L2 20h20L12 3z" />
            <path d="M12 10v4M12 17h.01" />
          </svg>
          <span>
            <b className="text-[#8F3A28]">2 overlapping block requests</b> detected on AGC–GWL
            corridor · suggested resolution ready on the Conflict screen
          </span>
          <button
            onClick={() => setScreen('conflict')}
            className="ml-auto text-[11.5px] font-medium bg-cream-100 border border-cream-300 px-3 py-1.5 rounded-md hover:bg-cream-200"
          >
            Review →
          </button>
        </div>
      )}

      <div className="grid grid-cols-[1.6fr_1fr] gap-3.5">
        <Card>
          <div className="px-4 py-3 border-b border-cream-200 flex items-center">
            <span className="text-[12.5px] font-semibold text-ink-900">
              Block Utilisation by Corridor — this week
            </span>
            <span className="ml-auto text-[11px] text-ink-500">block-hours / available hours</span>
          </div>
          <div className="p-4 space-y-3">
            {SECTIONS.map((sec) => {
              const pct = utilFor(sec, blocks);
              return (
                <div key={sec}>
                  <div className="flex justify-between text-[11.5px] mb-1">
                    <span className="text-ink-700">{sec}</span>
                    <span className="num text-ink-500">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: pct > 70 ? '#B9812C' : '#3AACA3' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-cream-200 flex items-center">
            <span className="text-[12.5px] font-semibold text-ink-900">Live Ops Feed</span>
            <span className="ml-auto text-[11px] text-ink-500">live · websocket</span>
          </div>
          <div className="max-h-[340px] overflow-y-auto">
            {feed.map((f, i) => (
              <div key={i} className="flex gap-2.5 px-4 py-2.5 border-b border-cream-200 text-[11.5px] items-start">
                <span className="num text-ink-500 text-[10px] pt-0.5 whitespace-nowrap">{f[0]}</span>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: f[1] }} />
                <span className="text-ink-700">{f[2]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
