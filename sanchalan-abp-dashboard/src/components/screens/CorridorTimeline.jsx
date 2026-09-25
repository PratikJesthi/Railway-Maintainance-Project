import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';
import SimulationHUD from '../SimulationHUD.jsx';

const ZOOMS = { day: { hours: 24, label: 'Day' }, week: { hours: 168, label: 'Week' }, month: { hours: 168 * 4, label: 'Month' } };

export default function CorridorTimeline() {
  const { blocks, sections: SECTIONS, depts: DEPTS, setPanelBlock, nowH, sandbox, previewScenario } = useApp();
  const [zoom, setZoom] = useState('week');
  const totalHours = ZOOMS[zoom].hours;
  const colCount = zoom === 'day' ? 24 : zoom === 'week' ? 7 : 4;
  const colLabel = (i) =>
    zoom === 'day' ? `${i}:00` : zoom === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] : `Wk ${i + 1}`;

  const barRefs = useRef({});
  const justDraggedRef = useRef(false);

  const handlePointerDown = (e, b) => {
    if (!sandbox) return;
    e.stopPropagation();
    const el = barRefs.current[b.id];
    if (!el) return;
    const track = el.parentElement;
    const trackWidth = track.clientWidth || 1;
    const startX = e.clientX;
    const origStart = b.start;
    const dur = b.dur;
    let moved = false;
    let newStart = origStart;

    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {}

    el.classList.add('opacity-90', 'shadow-lg', 'cursor-grabbing', 'z-10', 'border-2', 'border-dashed', 'border-amber-400');

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      const dh = (dx / trackWidth) * totalHours;
      newStart = Math.round(Math.min(totalHours - dur, Math.max(0, origStart + dh)));
      el.style.left = `${(newStart / totalHours) * 100}%`;
    };

    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      try {
        if (el.hasPointerCapture && el.hasPointerCapture(ev.pointerId)) {
          el.releasePointerCapture(ev.pointerId);
        }
      } catch (_) {}
      el.classList.remove('opacity-90', 'shadow-lg', 'cursor-grabbing', 'z-10', 'border-2', 'border-dashed', 'border-amber-400');
      el.style.left = `${(origStart / totalHours) * 100}%`;
      if (!moved) return;
      justDraggedRef.current = true;
      previewScenario(b, newStart);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleBarClick = (b) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    setPanelBlock(b);
  };

  return (
    <div className="screen-enter space-y-4">
      <Card className="relative overflow-hidden bg-[#101B2D]">
        {/* Subtle OHE overhead-wire / track texture background layer */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: 'url(/images/ir_tracks_signal.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Header Bar */}
        <div className="relative z-10 px-5 py-3.5 border-b border-[#26364D] bg-[#050B16] flex flex-wrap items-center justify-between gap-3 text-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-white font-mono tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
              CORRIDOR POSSESSION TIMELINE — NDLS → BPL
            </h2>
            {sandbox && (
              <span className="text-[10px] font-bold font-mono tracking-wide px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 animate-pulse">
                SANDBOX · DRAG BLOCK TO RESCHEDULE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11.5px] font-mono text-slate-300 hidden sm:inline font-semibold">
              Horizon: <strong className="text-white">Week 37 (22-28 Sep 2026)</strong>
            </span>
            <div className="flex bg-[#101B2D] border border-[#26364D] rounded p-0.5 font-mono">
              {Object.entries(ZOOMS).map(([key, z]) => (
                <button
                  key={key}
                  onClick={() => setZoom(key)}
                  className={
                    'text-[11px] font-bold px-3 py-1 rounded transition-all ' +
                    (zoom === key ? 'bg-[#06B6D4] text-slate-950 shadow-sm font-bold' : 'text-slate-300 hover:text-white')
                  }
                >
                  {z.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 p-5">
          {/* Department Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-[11.5px] font-mono font-medium text-slate-300 items-center bg-[#0B1424] p-3.5 rounded-md border border-[#26364D]">
            <span className="text-[10.5px] uppercase font-bold text-[#06B6D4] mr-1">POSSESSION TYPES:</span>
            {Object.entries(DEPTS).map(([k, d]) => (
              <span key={k} className="flex items-center gap-2">
                <i className="w-3.5 h-2.5 rounded-xs inline-block shadow-sm" style={{ background: d.color }} />
                <span className="text-slate-200 font-bold">{d.name}</span>
              </span>
            ))}
            <span className="flex items-center gap-2 ml-auto">
              <i className="w-4 h-2.5 rounded-xs inline-block border border-red-500 conflict-stripes shadow-sm" />
              <span className="text-red-400 font-bold uppercase">Conflict / Overlap</span>
            </span>
          </div>

          {/* Timeline Grid Instrument */}
          <div className="overflow-x-auto border border-[#26364D] rounded-md bg-[#050B16]">
            <div className="min-w-[960px]">
              {/* Column Timeline Headers */}
              <div className="grid border-b border-[#26364D] bg-[#0B1424]" style={{ gridTemplateColumns: `150px 1fr` }}>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#06B6D4] px-3.5 py-2.5 border-r border-[#26364D] flex items-center">
                  SECTION / CORRIDOR
                </div>
                <div className="grid relative" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
                  {Array.from({ length: colCount }).map((_, i) => (
                    <div
                      key={i}
                      className="text-center text-slate-300 num text-[11px] font-bold py-2 border-r border-[#26364D]"
                    >
                      {colLabel(i)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Rows */}
              {SECTIONS.map((sec) => {
                const secBlocks = blocks.filter((b) => b.sec === sec);
                return (
                  <div key={sec} className="grid border-b border-[#26364D]/80 hover:bg-[#0B1424]/60 transition-colors" style={{ gridTemplateColumns: `150px 1fr` }}>
                    <div className="flex items-center justify-between px-3.5 py-3 text-[12.5px] font-mono font-bold text-slate-100 border-r border-[#26364D] bg-[#0B1424]">
                      <span>{sec}</span>
                    </div>

                    <div className="relative h-12 border-r border-[#26364D] bg-[#050B16] rail-grid-bg">
                      {/* Current Time Vertical Line Marker */}
                      {zoom === 'week' && nowH >= 0 && nowH <= totalHours && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 shadow-[0_0_8px_#EF4444]"
                          style={{ left: `${(nowH / totalHours) * 100}%` }}
                        >
                          <span className="absolute -top-2.5 -left-3 num text-[9px] font-bold font-mono text-white bg-red-600 px-1 py-0.2 rounded shadow-xs">
                            NOW
                          </span>
                        </div>
                      )}

                      {/* Possession Block Bars */}
                      {secBlocks.map((b) => {
                        const dept = DEPTS[b.dept];
                        const left = (b.start / totalHours) * 100;
                        const width = (b.dur / totalHours) * 100;
                        if (left > 100 || left + width < 0) return null;
                        return (
                          <button
                            key={b.id}
                            ref={(el) => {
                              barRefs.current[b.id] = el;
                            }}
                            onPointerDown={(e) => handlePointerDown(e, b)}
                            onClick={() => handleBarClick(b)}
                            className={
                              'absolute top-[8px] h-[28px] rounded flex items-center justify-between px-2 text-[11px] font-mono font-bold whitespace-nowrap select-none touch-none transition-transform hover:scale-[1.02] shadow-md border border-black/30 ' +
                              (b.conflict ? 'conflict-stripes text-white font-black' : '') +
                              (sandbox ? ' cursor-grab' : ' cursor-pointer')
                            }
                            style={{
                              left: `${Math.max(0, left)}%`,
                              width: `${Math.max(1.5, width)}%`,
                              background: b.conflict
                                ? undefined
                                : dept.color,
                              color: '#FFFFFF',
                            }}
                            title={`${b.id} (${b.dur}h window) · ${b.defect}${sandbox ? ' — drag to reschedule' : ''}`}
                          >
                            <span className="truncate">{b.id}</span>
                            <span className="text-[9.5px] opacity-90 font-normal hidden md:inline ml-1">{b.dur}h</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      <SimulationHUD />
    </div>
  );

}
