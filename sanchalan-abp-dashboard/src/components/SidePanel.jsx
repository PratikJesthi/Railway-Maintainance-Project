import React from 'react';
import { useApp, SCREENS } from '../context/AppContext.jsx';

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-cream-200 text-[12px]">
      <span className="text-ink-500">{k}</span>
      <span className="num text-right text-ink-900">{v}</span>
    </div>
  );
}

export default function SidePanel() {
  const { panelBlock, setPanelBlock, setScreen, depts: DEPTS } = useApp();
  const open = !!panelBlock;
  const b = panelBlock;
  const dept = b ? DEPTS[b.dept] : null;

  return (
    <>
      <div
        onClick={() => setPanelBlock(null)}
        className={
          'fixed inset-0 bg-ink-900/25 z-40 transition-opacity ' +
          (open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
      />
      <aside
        className={
          'fixed top-0 right-0 h-full w-[360px] bg-cream-50 border-l border-cream-300 shadow-panel z-50 transition-transform overflow-y-auto ' +
          (open ? 'translate-x-0' : 'translate-x-full')
        }
      >
        {b && (
          <>
            <div className="flex items-center px-4 py-4 border-b border-cream-300">
              <span className="font-semibold text-[13.5px] text-ink-900">{b.id}</span>
              <button
                onClick={() => setPanelBlock(null)}
                className="ml-auto text-ink-500 hover:text-ink-900 text-lg leading-none px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <span
                className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-1 rounded"
                style={{ background: dept.tint, color: dept.text }}
              >
                <i className="w-1.5 h-1.5 rounded-sm inline-block" style={{ background: dept.color }} />
                {dept.name.toUpperCase()}
              </span>

              <div className="mt-3">
                <Row k="Section" v={b.sec} />
                <Row k="Defect" v={b.defect} />
                <Row k="Severity" v={b.sev} />
                <Row k="Overdue" v={`${b.overdue} days`} />
                <Row k="Window" v={`${Math.round(b.start)}h → ${Math.round(b.start + b.dur)}h (wk)`} />
                <Row k="Status" v={b.st} />
                <Row k="Source system" v={b.src} />
              </div>

              <div className="mt-3 text-[11.5px] text-ink-500 leading-relaxed border-l-2 border-cream-300 pl-3">
                {b.note}
              </div>

              {b.conflict && (
                <button
                  onClick={() => {
                    setScreen('conflict');
                    setPanelBlock(null);
                  }}
                  className="mt-4 w-full bg-dept-alert text-white text-[12px] font-medium py-2 rounded-md hover:opacity-90"
                  style={{ background: '#BB4430' }}
                >
                  Review conflict →
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
