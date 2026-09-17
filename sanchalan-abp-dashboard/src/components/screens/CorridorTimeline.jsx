import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';

const ZOOMS = { day: { hours: 24, label: 'Day' }, week: { hours: 168, label: 'Week' }, month: { hours: 168 * 4, label: 'Month' } };

export default function CorridorTimeline() {
  const { blocks, sections: SECTIONS, depts: DEPTS, setPanelBlock, nowH } = useApp();
  const [zoom, setZoom] = useState('week');
  const totalHours = ZOOMS[zoom].hours;
  const colCount = zoom === 'day' ? 24 : zoom === 'week' ? 7 : 4;
  const colLabel = (i) =>
    zoom === 'day' ? `${i}:00` : zoom === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] : `Wk ${i + 1}`;

  return (
    <div className="screen-enter">
      <Card>
        <div className="px-4 py-3 border-b border-cream-200 flex items-center">
          <span className="text-[12.5px] font-semibold text-ink-900">
            Corridor Timeline — NDLS → BPL
          </span>
          <div className="ml-auto flex bg-cream-100 border border-cream-300 rounded-md p-0.5">
            {Object.entries(ZOOMS).map(([key, z]) => (
              <button
                key={key}
                onClick={() => setZoom(key)}
                className={
                  'text-[11px] font-medium px-3 py-1 rounded ' +
                  (zoom === key ? 'bg-cream-50 text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-900')
                }
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-4 mb-3 text-[11px] text-ink-500 items-center">
            {Object.entries(DEPTS).map(([k, d]) => (
              <span key={k} className="flex items-center gap-1.5">
                <i className="w-3.5 h-2 rounded-sm inline-block" style={{ background: d.color }} />
                {d.name}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <i
                className="w-3.5 h-2 rounded-sm inline-block"
                style={{ background: 'repeating-linear-gradient(45deg,#BB4430 0 3px,#7A2C24 3px 6px)' }}
              />
              Conflict — unresolved
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* column header */}
              <div className="grid border-b border-cream-200" style={{ gridTemplateColumns: `130px 1fr` }}>
                <div className="text-[10px] uppercase tracking-wide text-ink-500 px-2.5 py-2 border-r border-cream-200">
                  Section
                </div>
                <div className="grid relative" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
                  {Array.from({ length: colCount }).map((_, i) => (
                    <div
                      key={i}
                      className="text-center text-ink-300 num text-[9.5px] pt-1.5 border-r border-dashed border-cream-200"
                    >
                      {colLabel(i)}
                    </div>
                  ))}
                </div>
              </div>

              {SECTIONS.map((sec) => {
                const secBlocks = blocks.filter((b) => b.sec === sec);
                return (
                  <div key={sec} className="grid border-b border-cream-200" style={{ gridTemplateColumns: `130px 1fr` }}>
                    <div className="flex items-center justify-between px-2.5 text-[11.5px] text-ink-900 border-r border-cream-200">
                      <span>{sec}</span>
                    </div>
                    <div className="relative h-11 border-r border-cream-200">
                      {zoom === 'week' && nowH >= 0 && nowH <= totalHours && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-[#BB4430] opacity-70 z-[2]"
                          style={{ left: `${(nowH / totalHours) * 100}%` }}
                        >
                          <span className="absolute -top-1 left-1 num text-[8px] text-[#BB4430]">NOW</span>
                        </div>
                      )}
                      {secBlocks.map((b) => {
                        const dept = DEPTS[b.dept];
                        const left = (b.start / totalHours) * 100;
                        const width = (b.dur / totalHours) * 100;
                        if (left > 100 || left + width < 0) return null;
                        return (
                          <button
                            key={b.id}
                            onClick={() => setPanelBlock(b)}
                            className="absolute top-[9px] h-[26px] rounded flex items-center gap-1 px-2 text-[10px] font-semibold overflow-hidden whitespace-nowrap hover:-translate-y-0.5 hover:shadow-soft transition-transform"
                            style={{
                              left: `${Math.max(0, left)}%`,
                              width: `${Math.max(1.2, width)}%`,
                              background: b.conflict
                                ? 'repeating-linear-gradient(45deg,#BB4430 0 6px,#D67B69 6px 12px)'
                                : dept.color,
                              color: '#FBF6EA',
                            }}
                            title={`${b.id} · ${b.defect}`}
                          >
                            <span className="truncate">{b.id}</span>
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
    </div>
  );
}
