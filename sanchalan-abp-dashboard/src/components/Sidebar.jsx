import React from 'react';
import { useApp, SCREENS } from '../context/AppContext.jsx';

const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
  ),
  command: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
  ),
  timeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h14M3 18h18" /><circle cx="17" cy="12" r="2.5" fill="#0D9488" /></svg>
  ),
  timetable: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 4v16M15 9v11" /></svg>
  ),
  queue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h11M4 18h7" /><path d="M19 10l3 3-3 3" /></svg>
  ),
  conflict: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3L2 20h20L12 3z" /><path d="M12 9v5M12 17h.01" strokeWidth="2.5" /></svg>
  ),
  assets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 20V10M10 20V4M17 20v-7" /><path d="M2 20h18" /></svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3h6l3 3v15H6V3z" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>
  ),
};

export default function Sidebar() {
  const { screen, setScreen } = useApp();

  return (
    <nav className="relative w-64 shrink-0 border-r border-[#26364D] flex flex-col select-none text-slate-200 overflow-hidden">
      {/* 2. SIDEBAR RAILWAY BACKGROUND LAYER */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url(/images/ir_sidebar_bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#050B16]/92 via-[#0B1424]/85 to-[#050B16]/95 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Navigation Header */}
        <div className="px-5 pt-4 pb-3.5 border-b border-[#26364D] bg-[#050B16]/80 backdrop-blur-sm">
          <div className="text-[10.5px] uppercase font-bold tracking-widest text-[#06B6D4] mb-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
            OPERATIONS CONSOLE · नियंत्रण
          </div>
          <div className="font-mono text-[12px] font-bold text-white">
            CENTRAL RAILWAY REGION
          </div>
        </div>

        {/* Main Technical Navigation Menu */}
        <div className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
          {Object.values(SCREENS).map((s) => {
            const active = screen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setScreen(s.id)}
                className={
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-150 relative group ' +
                  (active
                    ? 'bg-[#101B2D]/90 text-white font-bold border-l-4 border-[#06B6D4] pl-2.5 shadow-md backdrop-blur-md'
                    : 'text-slate-300 hover:bg-[#101B2D]/60 hover:text-white font-medium')
                }
              >
                <span className={'w-4 h-4 shrink-0 transition-colors ' + (active ? 'text-[#06B6D4]' : 'text-slate-400 group-hover:text-[#06B6D4]')}>
                  {ICONS[s.id] || ICONS['command']}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] leading-tight font-display tracking-tight truncate">{s.title}</span>
                  <span className={'block text-[10px] font-mono truncate mt-0.5 ' + (active ? 'text-cyan-300' : 'text-slate-400')}>{s.hindi}</span>
                </span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Lower Sidebar Identity Footer */}
        <div className="mt-auto p-4 border-t border-[#26364D] bg-[#050B16]/90 backdrop-blur-md text-[11.5px] leading-relaxed">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
            <span className="font-bold text-white font-mono text-[12px] uppercase">Central Railway</span>
          </div>
          <div className="text-[11.5px] font-mono text-[#06B6D4] font-bold">
            NDLS → BPL CORRIDOR
          </div>
          <div className="text-[10px] text-slate-300 mt-1 font-mono uppercase tracking-wider font-semibold">
            BUILD V2.0 · KAVACH COMPLIANT
          </div>
          <div className="text-[10.5px] text-slate-400 mt-1.5 pt-1.5 border-t border-[#26364D] font-medium">
            सुव्यवस्थित • विश्वसनीय रेल सेवा
          </div>
        </div>
      </div>
    </nav>
  );
}

