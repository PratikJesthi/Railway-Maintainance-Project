import React, { useEffect, useState } from 'react';
import { useApp, SCREENS } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar() {
  const {
    screen, aiMode, setAiMode,
    sandbox, toggleSandbox,
    simRunning, startSimulation,
    setScreen,
  } = useApp();
  const { user, logout } = useAuth();

  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Global shortcut (Ctrl+K) handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const meta = SCREENS[screen] || SCREENS['command'];

  return (
    <header className="h-16 shrink-0 bg-[#0B1424] border-b border-[#26364D] flex items-center justify-between px-6 shadow-md z-30 select-none text-slate-100">
      {/* Brand & Indian Railways Emblem Header */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/60 p-0.5 flex items-center justify-center shrink-0 shadow-sm">
          <img src="/images/ir_emblem.svg" alt="Indian Railways Emblem" className="w-9 h-9 object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[16px] tracking-wide text-white font-display">SANCHALAN</span>
            <span className="text-[12px] font-semibold text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/30 font-mono">
              संचालन
            </span>
          </div>
          <div className="text-[11px] uppercase tracking-wider text-slate-300 font-mono font-medium">
            Automatic Block Planning
          </div>
        </div>
      </div>

      {/* Global Search Bar with Ctrl+K shortcut */}
      <div className="relative w-80">
        <div className="flex items-center bg-[#101B2D] border border-[#26364D] rounded px-3 py-1.5 focus-within:border-[#06B6D4] transition-colors">
          <svg className="w-4 h-4 text-slate-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search train, section, block, defect..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="bg-transparent border-none text-[12.5px] text-white placeholder-slate-400 focus:outline-none w-full font-sans"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono bg-[#050B16] text-slate-300 border border-[#26364D] px-1.5 py-0.5 rounded ml-1 font-semibold">
            Ctrl+K
          </kbd>
        </div>

        {/* Quick search popup results */}
        {searchOpen && searchQuery.trim() !== '' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#101B2D] border border-[#26364D] rounded shadow-xl p-2 z-50 text-[12px]">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Quick Navigate</div>
            <button
              onClick={() => { setScreen('timetable'); setSearchOpen(false); }}
              className="w-full text-left px-2.5 py-2 hover:bg-[#142238] rounded text-white font-mono"
            >
              
              🚄 Search train: "{searchQuery}" → Train Timetable
            </button>
            <button
              onClick={() => { setScreen('timeline'); setSearchOpen(false); }}
              className="w-full text-left px-2.5 py-2 hover:bg-[#142238] rounded text-white font-mono"
            >
              🚥 Search block: "{searchQuery}" → Corridor Timeline
            </button>
            <button
              onClick={() => { setScreen('queue'); setSearchOpen(false); }}
              className="w-full text-left px-2.5 py-2 hover:bg-[#142238] rounded text-white font-mono"
            >
              ⚠️ Search defect: "{searchQuery}" → Priority Queue
            </button>
          </div>
        )}
      </div>

      {/* Control Console Right Status Bar */}
      <div className="flex items-center gap-4">
        {/* Live Operational Status Signal LED */}
        <div className="flex items-center gap-2 bg-[#101B2D] border border-[#26364D] px-3 py-1 rounded text-[11.5px]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]"></span>
          </span>
          <span className="font-bold text-emerald-400 tracking-wide font-mono text-[11px]">COA SYNCED</span>
          <span className="text-[#26364D]">|</span>
          <span className="text-slate-300 font-mono text-[11px] font-semibold">ACTIVE</span>
        </div>

        {/* Operational Mode Toggle */}
        <div className="flex items-center gap-2 bg-[#101B2D] border border-[#26364D] px-2.5 py-1 rounded text-[11.5px]">
          <span className={!aiMode ? 'font-bold text-white' : 'text-slate-400'}>MANUAL</span>
          <button
            onClick={() => setAiMode((v) => !v)}
            aria-label="Toggle AI planning mode"
            className={
              'w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ' +
              (aiMode ? 'bg-[#06B6D4]' : 'bg-[#26364D]')
            }
          >
            <span
              className={
                'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ' +
                (aiMode ? 'translate-x-4' : 'translate-x-0.5')
              }
            />
          </button>
          <span className={aiMode ? 'font-bold text-[#06B6D4]' : 'text-slate-400'}>AI-SOLVER</span>
        </div>

        {/* Sandbox & Sim Buttons */}
        <button
          onClick={toggleSandbox}
          className={
            'text-[11.5px] font-bold font-mono px-3 py-1 rounded border transition-all shadow-sm ' +
            (sandbox
              ? 'bg-amber-600 border-amber-500 text-white animate-pulse'
              : 'bg-[#101B2D] border-[#26364D] text-slate-200 hover:border-[#06B6D4] hover:text-white')
          }
        >
          {sandbox ? '🧪 SANDBOX' : 'WHAT-IF'}
        </button>

        <button
          onClick={startSimulation}
          disabled={simRunning}
          className={
            'text-[11.5px] font-bold font-mono px-3 py-1 rounded border flex items-center gap-1 transition-all ' +
            (simRunning
              ? 'bg-[#101B2D] border-[#26364D] text-slate-500'
              : 'bg-[#101B2D] border-[#26364D] text-slate-200 hover:border-[#06B6D4] hover:text-white')
          }
        >
          {simRunning ? 'SIMULATING...' : '▶ 24H SIM'}
        </button>

        {/* Current Date & Clock IST */}
        <div className="border-l border-[#26364D] pl-3 text-right">
          <div className="num font-bold text-[13.5px] text-white tracking-wide leading-tight">{clock} IST</div>
          <div className="num text-[10.5px] text-slate-300 font-semibold">{currentDate}</div>
        </div>

        {/* Logged in Controller / Approver User Identity */}
        {user && (
          <div className="flex items-center gap-2.5 border-l border-[#26364D] pl-3">
            <div className="text-right leading-tight">
              <span className="block text-[12.5px] font-bold text-[#06B6D4] font-mono">{user.name}</span>
              <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                {user.role} · {user.departments.join('/')}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-[11px] font-bold bg-[#101B2D] border border-[#26364D] text-slate-200 hover:text-white hover:border-[#06B6D4] px-2.5 py-1 rounded transition-all"
            >
              LOGOUT
            </button>
          </div>
        )}
      </div>

    </header>
  );
}
