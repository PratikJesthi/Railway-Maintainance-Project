import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiJson } from '../../api/client.js';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';

// dept label → pill style map (matches CorridorTimeline palette)
const DEPT_STYLES = {
  ENG:    { bg: '#EAF7F6', color: '#0B615C', dot: '#0F7A73', label: 'ENGINEERING' },
  SNT:    { bg: '#F1ECF8', color: '#5E4380', dot: '#7C5AA6', label: 'SIGNAL & TELECOM' },
  TRAC:   { bg: '#FFF3E2', color: '#7A4800', dot: '#C97A00', label: 'TRACTION' },
  OHE:    { bg: '#FDECEA', color: '#8B2E1F', dot: '#BB4430', label: 'OHE' },
  Merged: { bg: '#EAF6EE', color: '#2E6D44', dot: '#3E8E5B', label: 'MERGED' },
};
function deptStyle(dept) {
  return DEPT_STYLES[dept] || { bg: '#F2F2F2', color: '#444', dot: '#888', label: dept };
}

// Format float hours → "HH:MM"
function fmtH(h) {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function ConflictResolution() {
  const { aiMode } = useApp();
  const [groups, setGroups] = useState(null);
  const [selected, setSelected] = useState(null);     // conflict_id of expanded group
  const [resolvedIds, setResolvedIds] = useState({}); // conflict_id → merged_block_id
  const [working, setWorking]   = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [error, setError] = useState(null);
  const token = useRef(localStorage.getItem('sanchalan_token'));

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

  // ── render helpers ────────────────────────────────────────────────────────

  if (groups === null) {
    return (
      <div className="screen-enter flex items-center justify-center py-20 text-ink-400 text-[12px]">
        Loading conflict groups…
      </div>
    );
  }

  const unresolvedGroups = groups.filter(g => !resolvedIds[g.conflict_id]);

  return (
    <div className="screen-enter">
      {error && (
        <div className="mb-3.5 px-4 py-3 rounded-lg border border-[#E8C4BE] bg-[#FFF0EE] text-[12px] text-[#A24A38]">
          ⚠ {error}
        </div>
      )}

      {Object.keys(resolvedIds).length > 0 && (
        <div className="mb-3.5 px-4 py-3 rounded-lg border border-[#B7D9C2] bg-[#EAF6EE] text-[12px] text-[#2E6D44]">
          ✓ {Object.keys(resolvedIds).length} conflict{Object.keys(resolvedIds).length > 1 ? 's' : ''} resolved
          — blocks merged on corridor. Manual override log updated.
        </div>
      )}

      {/* Group sidebar */}
      {unresolvedGroups.length === 0 ? (
        <div className="px-4 py-12 text-center text-ink-400 text-[12px]">
          No active conflicts — all clear ✓
        </div>
      ) : (
        <div className="flex gap-3.5">
          {/* Left pill list */}
          <div className="flex flex-col gap-2 w-[160px] shrink-0">
            {unresolvedGroups.map(g => (
              <button
                key={g.conflict_id}
                onClick={() => { setSelected(g.conflict_id); setShowOverride(false); }}
                className={`text-left px-3 py-2.5 rounded-lg border text-[11.5px] transition-all ${
                  selected === g.conflict_id
                    ? 'bg-[#FFF0EE] border-[#D9AFA3] text-[#A24A38] font-semibold'
                    : 'bg-cream-50 border-cream-200 text-ink-600 hover:bg-cream-100'
                }`}
              >
                <div className="font-semibold mb-0.5">{g.conflict_id}</div>
                <div className="text-[10.5px] leading-tight text-ink-400 truncate">{g.sec}</div>
                <div className="text-[10px] text-ink-400 mt-0.5">{g.block_ids.length} blocks</div>
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
                <Card className="mb-3.5">
                  <div className="px-4 py-3 border-b border-cream-200 flex items-center">
                    <span className="text-[12.5px] font-semibold text-ink-900">
                      Active Conflict · {group.conflict_id}
                    </span>
                    <span className="ml-auto text-[11px] text-ink-500">
                      {group.sec} · {fmtH(mergedStart)}–{fmtH(mergedEnd)} overlap
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Block pair cards */}
                    <div className={`grid gap-3.5 mb-3.5 ${group.blocks.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {group.blocks.map(blk => {
                        const ds = deptStyle(blk.dept);
                        return (
                          <div key={blk.id} className="bg-cream-100 border border-cream-300 rounded-card p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span
                                className="text-[10.5px] font-semibold px-2 py-1 rounded flex items-center gap-1.5"
                                style={{ background: ds.bg, color: ds.color }}
                              >
                                <i className="w-1.5 h-1.5 rounded-sm inline-block" style={{ background: ds.dot }} />
                                {ds.label}
                              </span>
                              <span className="font-mono text-[9.5px] text-ink-500 border border-cream-300 px-1.5 py-0.5 rounded">
                                {blk.src}
                              </span>
                            </div>
                            <DRow k="Block ID"        v={blk.id} />
                            <DRow k="Defect"          v={blk.defect} />
                            <DRow k="Severity / overdue" v={`${blk.sev} · ${blk.overdue}d`} />
                            <DRow k="Window"          v={`${fmtH(blk.start)} – ${fmtH(blk.start + blk.dur)}`} />
                            <DRow k="Duration"        v={`${blk.dur.toFixed(1)}h`} />
                          </div>
                        );
                      })}
                    </div>

                    {/* AI suggestion */}
                    <div className="flex gap-4 items-start bg-cream-100 border border-cream-300 rounded-card p-4">
                      <div className="w-8 h-8 rounded-lg bg-[#EAF6EE] flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3E8E5B" strokeWidth="2">
                          <path d="M12 2a7 7 0 0 1 4 12.7V17a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-2.3A7 7 0 0 1 12 2z" />
                          <path d="M9 21h6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1 text-[12.5px]">
                          Suggested resolution:{' '}
                          <span className="text-[#2E6D44]">merge into combined block</span>
                        </div>
                        <div className="text-ink-500 text-[11px] leading-relaxed border-l-2 border-cream-300 pl-2.5">
                          <b className="text-ink-900">Why: </b>
                          departments don't share track assets — the union window{' '}
                          <b>{fmtH(mergedStart)}–{fmtH(mergedEnd)}</b> ({mergedDur}h) keeps both
                          defects inside their SLA. Merging removes duplicate possession time
                          and clears conflict-hours on <b>{group.sec}</b>.
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2.5 mt-4">
                      <button
                        onClick={() => doResolve(aiMode ? 'ai' : 'accept')}
                        disabled={working}
                        className="text-[11.5px] font-medium px-3.5 py-2 rounded-md text-white disabled:opacity-60"
                        style={{ background: '#3E8E5B' }}
                      >
                        {working ? '⏳ Working…' : '✓ Accept suggestion — merge blocks'}
                      </button>
                      <button
                        onClick={() => setShowOverride(v => !v)}
                        disabled={working}
                        className="text-[11.5px] font-medium px-3.5 py-2 rounded-md border disabled:opacity-60"
                        style={{ borderColor: '#D9AFA3', color: '#A24A38' }}
                      >
                        Manual override…
                      </button>
                    </div>
                    {showOverride && (
                      <div className="flex gap-2 mt-2.5 flex-wrap">
                        <OverrideBtn onClick={() => doResolve(`Prioritise ${group.blocks[0]?.dept} (other rescheduled)`)}>
                          Prioritise {group.blocks[0]?.dept} (other rescheduled)
                        </OverrideBtn>
                        <OverrideBtn onClick={() => doResolve(`Prioritise ${group.blocks[1]?.dept} (other rescheduled)`)}>
                          Prioritise {group.blocks[1]?.dept} (other rescheduled)
                        </OverrideBtn>
                        <OverrideBtn onClick={() => doResolve('Split window 50/50')}>
                          Split window 50/50
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
    <div className="flex justify-between py-1.5 border-b border-cream-200 text-[11.5px] last:border-b-0">
      <span className="text-ink-500">{k}</span>
      <span className="num text-right text-ink-900">{v}</span>
    </div>
  );
}

function OverrideBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-medium bg-cream-50 border border-cream-300 px-3 py-1.5 rounded-md hover:bg-cream-200"
    >
      {children}
    </button>
  );
}
