import React from 'react';
import { useApp, SCREENS } from '../context/AppContext.jsx';

const ICONS = {
  command: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
  ),
  timeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h12M3 18h18" /><circle cx="17" cy="12" r="2" /></svg>
  ),
  timetable: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 4v16" /></svg>
  ),
  queue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h10M4 18h7" /></svg>
  ),
  conflict: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3L2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20V10M11 20V4M18 20v-7" /></svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3h6l3 3v15H6V3z" /><path d="M9 9h6M9 13h6M9 17h3" /></svg>
  ),
};

export default function Sidebar() {
  const { screen, setScreen } = useApp();

  return (
    <nav className="w-56 shrink-0 bg-cream-100/80 border-r border-cream-300 flex flex-col">
      <div className="px-4 pt-5 pb-4 border-b border-cream-300">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">🚦</span>
          <div>
            <div className="font-display font-semibold text-[15px] tracking-wide text-ink-900">
              SANCHALAN
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-500 mt-0.5">
              संचालन · Block Planning
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-2">
        {Object.values(SCREENS).map((s) => {
          const active = screen === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScreen(s.id)}
              className={
                'w-full flex items-center gap-3 px-4 py-2.5 text-left border-l-2 transition-colors ' +
                (active
                  ? 'border-cyan-600 bg-cyan-50 text-ink-900'
                  : 'border-transparent text-ink-500 hover:bg-cream-200/60 hover:text-ink-900')
              }
            >
              <span className={'w-4 h-4 shrink-0 ' + (active ? 'text-cyan-600' : 'text-ink-500')}>
                {ICONS[s.id]}
              </span>
              <span>
                <span className="block text-[12.5px] font-medium">{s.title}</span>
                <span className="block text-[10px] text-ink-500/80">{s.hindi}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto px-4 py-3 border-t border-cream-300 text-[10.5px] leading-relaxed text-ink-500">
        Central Railway · NDLS–BPL corridor
        <br />
        Build v2.0 · कवच-सुसंगत डेटा फीड
      </div>
    </nav>
  );
}
