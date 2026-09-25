import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiJson } from '../../api/client.js';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';

// dept label → pill style map
const DEPT_STYLES = {
  ENG:    { bg: '#06B6D420', color: '#06B6D4', dot: '#06B6D4', label: 'ENGINEERING (P.WAY)' },
  SNT:    { bg: '#8B5CF620', color: '#8B5CF6', dot: '#8B5CF6', label: 'SIGNAL & TELECOM' },
  TRAC:   { bg: '#F59E0B20', color: '#F59E0B', dot: '#F59E0B', label: 'TRACTION (OHE)' },
  OHE:    { bg: '#F59E0B20', color: '#F59E0B', dot: '#F59E0B', label: 'TRACTION (OHE)' },
  Merged: { bg: '#3B82F620', color: '#3B82F6', dot: '#3B82F6', label: 'COMBINED BLOCK' },
};
function deptStyle(dept) {
  return DEPT_STYLES[dept] || { bg: '#26364D', color: '#94A3B8', dot: '#64748B', label: dept };
}

// Format float hours → "HH:MM IST"
function fmtH(h) {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} IST`;
}

export default function ConflictResolution() {
  const { aiMode } = useApp();
  const [groups, setGroups] = useState(null);
  const [selected, setSelected] = useState(null);     // conflict_id of expanded group
  const [resolvedIds, setResolvedIds] = useState({}); // conflict_id → merged_block_id
  const [working, setWorking]   = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [error, setError] = useState(null);

  const loadConflicts = useCallback(async () => {
    try {
      const data = await apiJson.get('/api/conflicts');
      setGroups(data);
      if (data.length > 0 && selected === null) setSelected(data[0].conflict_id);
    } catch (e) {
      setError('Failed to load conflicts: ' + (e.message || e));
    }
  }, [selected]);

  useEffect(() => { loadConflicts(); }, []);

  async function doResolve(method) {
    if (!selected) return;
    const group = groups.find(g => g.conflict_id === selected);
    if (!group) return;
    setWorking(true);
    setError(null);
    try {
      const body = {
        conflict_id: group.conflict_id,
        block_ids: group.block_ids,
        method,
        by: 'Control User',
      };
      const result = await apiJson.post('/api/conflicts/resolve', body);
      setResolvedIds(prev => ({ ...prev, [selected]: result.merged_block?.id || true }));
      // Reload groups so the resolved pair vanishes
      await loadConflicts();
    } catch (e) {
      setError(e.message || 'Resolution failed');
    } finally {
      setWorking(false);
    }
  }

  if (groups === null) {
    return (
      <div className="screen-enter flex items-center justify-center py-20 text-slate-400 font-mono text-[12px]">
        Loading conflict detection engine &amp; solver states…
      </div>
    );
  }

  const unresolvedGroups = groups.filter(g => !resolvedIds[g.conflict_id]);

  return (
    <div className="screen-enter space-y-4">
      {/* Workflow Stage Header Bar */}
      <div className="bg-[#101B2D] border border-[#26364D] rounded-md p-4 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444] animate-pulse" />
          <span className="font-bold text-white text-[14px]">
            CONFLICT RESOLUTION ENGINE · CORRIDOR BOTTLENECK ANALYSIS
          </span>
        </div>

        {/* 5-Step Resolution Pipeline Visual Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-[10.5px] font-bold">
          <span className="bg-red-950 text-red-400 border border-red-700/60 px-2 py-0.5 rounded">1. PROBLEM</span>
          <span className="text-slate-600">→</span>
          <span className="bg-amber-950 text-amber-400 border border-amber-700/60 px-2 py-0.5 rounded">2. OVERLAP</span>
          <span className="text-slate-600">→</span>
          <span className="bg-violet-950 text-violet-300 border border-violet-700/60 px-2 py-0.5 rounded">3. ANALYSIS</span>
          <span className="text-slate-600">→</span>
          <span className="bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded">4. PROPOSAL</span>
          <span className="text-slate-600">→</span>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded">5. APPROVAL</span>
        </div>
      </div>

      {error && (
        <div className="mb-3.5 px-4 py-3 rounded-md border border-red-700/60 bg-red-950/40 text-[12px] text-red-300 font-mono">
          ⚠ {error}
        </div>
      )}

      {Object.keys(resolvedIds).length > 0 && (
        <div className="mb-3.5 px-4 py-3 rounded-md border border-emerald-700/60 bg-emerald-950/40 text-[12px] text-emerald-300 font-mono">
          ✓ {Object.keys(resolvedIds).length} conflict{Object.keys(resolvedIds).length > 1 ? 's' : ''} resolved
          — combined block created on corridor. COA &amp; manual audit log updated.
        </div>
      )}

      {/* Group sidebar */}
      {unresolvedGroups.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 font-mono text-[12.5px] bg-[#101B2D]">
          <span className="text-emerald-400 text-2xl block mb-2">✓</span>
          No active cross-departmental conflicts on NDLS → BPL Corridor — all clear.
        </Card>
      ) : (
        <div className="flex gap-4">
          {/* Left pill list */}
          <div className="flex flex-col gap-2 w-[200px] shrink-0 font-mono">
            {unresolvedGroups.map(g => (
              <button
                key={g.conflict_id}
                onClick={() => { setSelected(g.conflict_id); setShowOverride(false); }}
                className={`text-left px-3.5 py-3 rounded-md border text-[11.5px] transition-all relative overflow-hidden ${
                  selected === g.conflict_id
                    ? 'bg-[#142238] border-[#06B6D4] text-white font-bold border-l-4 border-l-[#06B6D4] shadow-md'
                    : 'bg-[#101B2D] border-[#26364D] text-slate-300 hover:bg-[#142238] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-red-400">{g.conflict_id}</span>
                  <span className="text-[9px] bg-red-950 text-red-400 border border-red-700/50 px-1.5 py-0.2 rounded uppercase">HIGH</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 truncate">{g.sec}</div>
                <div className="text-[10px] text-slate-400 mt-1">{g.block_ids.length} overlapping blocks</div>
              </button>
            ))}
          </div>

          {/* Right detail panel */}
          {(() => {
            const group = unresolvedGroups.find(g => g.conflict_id === selected);
            if (!group) return null;
            const [a, b] = group.blocks;
            const mergedStart = Math.min(a.start, b?.start ?? a.start);
            const mergedEnd   = Math.max(a.start + a.dur, b ? b.start + b.dur : a.start + a.dur);
            const mergedDur   = (mergedEnd - mergedStart).toFixed(1);
            return (
              <div className="flex-1 min-w-0">
                <Card className="relative overflow-hidden bg-[#101B2D]">
                  {/* Subtle Railway Signal Background Texture Overlay */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                    style={{
                      backgroundImage: 'url(/images/ir_tracks_signal.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />

                  <div className="relative z-10 px-5 py-3.5 border-b border-[#26364D] bg-[#050B16] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-white font-mono">
                        CONFLICT DETECTED: {group.conflict_id}
                      </span>
                      <span className="text-[10px] bg-red-950 text-red-400 border border-red-700/60 px-2 py-0.5 rounded font-mono font-bold">
                        SEVERITY: CRITICAL OVERLAP
                      </span>
                    </div>
                    <span className="text-[11.5px] font-mono text-[#06B6D4] font-semibold">
                      Corridor: {group.sec} · Window: {fmtH(mergedStart)} – {fmtH(mergedEnd)}
                    </span>
                  </div>

                  <div className="relative z-10 p-5 space-y-4">
                    {/* Stage 1 & 2: Overlapping Blocks Comparison Grid */}
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      STAGE 1 &amp; 2: OVERLAPPING REQUEST COMPARISON
                    </div>

                    <div className={`grid gap-4 ${group.blocks.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {group.blocks.map(blk => {
                        const ds = deptStyle(blk.dept);
                        return (
                          <div key={blk.id} className="bg-[#0B1424] border border-[#26364D] rounded-md p-4">
                            <div className="flex items-center justify-between mb-3 border-b border-[#26364D] pb-2">
                              <span
                                className="text-[10.5px] font-bold px-2 py-1 rounded flex items-center gap-1.5 font-mono"
                                style={{ background: ds.bg, color: ds.color }}
                              >
                                <i className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ds.dot }} />
                                {ds.label}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 bg-[#101B2D] border border-[#26364D] px-2 py-0.5 rounded">
                                {blk.src}
                              </span>
                            </div>
                            <DRow k="Block ID"           v={blk.id} />
                            <DRow k="Defect ID"          v={blk.defect} />
                            <DRow k="Severity / Overdue" v={`${blk.sev} · ${blk.overdue} days`} />
                            <DRow k="Requested Window"  v={`${fmtH(blk.start)} – ${fmtH(blk.start + blk.dur)}`} />
                            <DRow k="Duration"           v={`${blk.dur.toFixed(1)} hrs`} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Stage 3 & 4: AI Analysis & Proposed Combined Block */}
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] font-bold pt-2">
                      STAGE 3 &amp; 4: CP-SAT ANALYSIS &amp; PROPOSED COMBINED BLOCK
                    </div>

                    <div className="bg-[#142238] border border-[#26364D] rounded-md p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-md bg-[#06B6D4]/15 border border-[#06B6D4]/40 flex items-center justify-center shrink-0 text-[#06B6D4] text-lg font-bold">
                          ⚡
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-[13px] font-display">
                            Suggested Resolution: <span className="text-[#06B6D4]">Combined Block (Union Window)</span>
                          </h4>
                          <p className="text-slate-300 text-[12px] leading-relaxed mt-1 font-sans">
                            Departments operate on non-interfering track assets. Merging into a single combined possession window{' '}
                            <b className="text-white font-mono">{fmtH(mergedStart)} – {fmtH(mergedEnd)}</b> ({mergedDur} hrs) clears both Engineering and Traction defects without secondary train holds.
                          </p>
                        </div>
                      </div>

                      {/* SLA & Network Impact Grid */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#26364D] font-mono text-[11px]">
                        <div className="bg-[#0B1424] p-2.5 rounded border border-[#26364D]">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">SLA Target Impact</span>
                          <span className="text-emerald-400 font-bold">100% On-Track ✓</span>
                        </div>
                        <div className="bg-[#0B1424] p-2.5 rounded border border-[#26364D]">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Corridor Line Saved</span>
                          <span className="text-cyan-300 font-bold">+2.5 hrs capacity</span>
                        </div>
                        <div className="bg-[#0B1424] p-2.5 rounded border border-[#26364D]">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Cascading Trains</span>
                          <span className="text-amber-400 font-bold">0 trains held</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 5: Approval & Action Controls */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => doResolve(aiMode ? 'ai' : 'accept')}
                        disabled={working}
                        className="text-[12.5px] font-mono font-bold px-5 py-2.5 rounded-md text-slate-950 bg-[#06B6D4] hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-60 transition-all uppercase tracking-wider"
                      >
                        {working ? '⏳ EXECUTING SOLVER…' : '✓ APPROVE COMBINED BLOCK'}
                      </button>
                      <button
                        onClick={() => setShowOverride(v => !v)}
                        disabled={working}
                        className="text-[12.5px] font-mono font-bold px-4 py-2.5 rounded-md border border-[#26364D] bg-[#0B1424] text-slate-300 hover:text-white hover:border-[#06B6D4] disabled:opacity-60 transition-all uppercase"
                      >
                        MANUAL OVERRIDE OPTIONS…
                      </button>
                    </div>

                    {showOverride && (
                      <div className="flex gap-2.5 mt-3 flex-wrap bg-[#050B16] p-3 rounded border border-[#26364D] font-mono">
                        <OverrideBtn onClick={() => doResolve(`Prioritise ${group.blocks[0]?.dept} (other rescheduled)`)}>
                          Prioritise {group.blocks[0]?.dept} (Reschedule {group.blocks[1]?.dept})
                        </OverrideBtn>
                        <OverrideBtn onClick={() => doResolve(`Prioritise ${group.blocks[1]?.dept} (other rescheduled)`)}>
                          Prioritise {group.blocks[1]?.dept} (Reschedule {group.blocks[0]?.dept})
                        </OverrideBtn>
                        <OverrideBtn onClick={() => doResolve('Split window 50/50')}>
                          Split Window 50/50
                        </OverrideBtn>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function DRow({ k, v }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#26364D] text-[11.5px] last:border-b-0 font-mono">
      <span className="text-slate-400">{k}</span>
      <span className="num text-right text-white font-semibold">{v}</span>
    </div>
  );
}

function OverrideBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-mono font-semibold bg-[#101B2D] border border-[#26364D] text-slate-200 px-3 py-1.5 rounded hover:bg-[#142238] hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}

