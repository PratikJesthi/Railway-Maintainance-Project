import React, { useEffect, useState } from 'react';
import { useApp, SCREENS } from '../context/AppContext.jsx';

export default function Topbar() {
  const { screen, aiMode, setAiMode } = useApp();
  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));

  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString('en-IN', { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);

  const meta = SCREENS[screen];

  return (
    <header className="h-14 shrink-0 bg-cream-50/90 backdrop-blur border-b border-cream-300 flex items-center gap-4 px-5">
      <div>
        <h1 className="text-[14px] font-semibold text-ink-900">{meta.title}</h1>
        <div className="text-[11px] text-ink-500">{meta.subtitle}</div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2 text-[11.5px] text-ink-500">
          <span className={!aiMode ? 'font-semibold text-ink-900' : ''}>Manual baseline</span>
          <button
            onClick={() => setAiMode((v) => !v)}
            aria-label="Toggle AI planning mode"
            className={
              'w-10 h-5 rounded-full relative border transition-colors ' +
              (aiMode ? 'bg-cyan-600 border-cyan-700' : 'bg-cream-300 border-cream-400')
            }
          >
            <span
              className={
                'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow ' +
                (aiMode ? 'left-[22px]' : 'left-0.5')
              }
            />
          </button>
          <span className={aiMode ? 'font-semibold text-cyan-700' : ''}>AI-optimised plan</span>
        </div>

        <div className="num text-[11.5px] text-ink-500 border-l border-cream-300 pl-4">{clock} IST</div>
      </div>
    </header>
  );
}
