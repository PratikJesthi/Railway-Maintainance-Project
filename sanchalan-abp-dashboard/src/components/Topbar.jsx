import React, { useEffect, useState } from 'react';
import { useApp, SCREENS } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar() {
  const {
    screen, aiMode, setAiMode,
    sandbox, toggleSandbox,
    simRunning, startSimulation,
    horizon, changeHorizon,
  } = useApp();
  const { user, logout } = useAuth();
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

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 text-[11.5px] text-ink-500">
          <span className={!aiMode ? 'font-semibold text-ink-900' : ''}>Manual</span>
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
          <span className={aiMode ? 'font-semibold text-cyan-700' : ''}>AI-optimised</span>
        </div>

        <button
          onClick={toggleSandbox}
          className={
            'text-[11px] font-medium px-3 py-1.5 rounded-md border ' +
            (sandbox
              ? 'bg-cyan-600 border-cyan-700 text-white'
              : 'bg-cream-50 border-cream-300 text-ink-700 hover:bg-cream-200')
          }
        >
          {sandbox ? '🧪 Exit sandbox' : 'What-if…'}
        </button>

        <button
          onClick={startSimulation}
          disabled={simRunning}
          className={
            'text-[11px] font-medium px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-all ' +
            (simRunning
              ? 'bg-cream-200 border-cream-400 text-ink-900'
              : 'bg-cream-50 border-cream-300 text-ink-700 hover:bg-cream-200')
          }
        >
          {simRunning ? 'Simulating 24h…' : '▶ Simulate 24h'}
        </button>

        {sandbox && (
          <span
            onClick={toggleSandbox}
            title="Click to exit"
            className="text-[10px] font-semibold tracking-wide px-2 py-1 rounded cursor-pointer"
            style={{ background: '#FBF1DE', color: '#8A6120' }}
          >
            SANDBOX · drag a block
          </span>
        )}

        <div className="flex bg-cream-100 border border-cream-300 rounded-md p-0.5">
          {['weekly', 'monthly'].map((h) => (
            <button
              key={h}
              onClick={() => changeHorizon(h)}
              className={
                'text-[11px] font-medium px-3 py-1 rounded capitalize ' +
                (horizon === h ? 'bg-cream-50 text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-900')
              }
            >
              {h}
            </button>
          ))}
        </div>

        <div className="num text-[11.5px] text-ink-500 border-l border-cream-300 pl-3">{clock} IST</div>

        {user && (
          <div className="flex items-center gap-2 border-l border-cream-300 pl-3">
            <span className="text-[11px] text-ink-700 text-right leading-tight">
              <span className="block font-medium">{user.name}</span>
              <span className="block text-[9.5px] text-ink-500 uppercase tracking-wide">
                {user.role} · {user.departments.join('/')}
              </span>
            </span>
            <button
              onClick={logout}
              className="text-[10.5px] font-medium bg-cream-100 border border-cream-300 px-2.5 py-1.5 rounded-md hover:bg-cream-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
