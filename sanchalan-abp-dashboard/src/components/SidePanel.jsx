import React from 'react';
import { useApp, SCREENS } from '../context/AppContext.jsx';
import { fmtWindow } from '../utils.js';

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-cream-200 text-[12px]">
      <span className="text-ink-500">{k}</span>
      <span className="num text-right text-ink-900">{v}</span>
    </div>
  );
}

export default function SidePanel() {
  const { panelBlock, setPanelBlock, setScreen, depts: DEPTS, approveBlock, overrideBlock } = useApp();
  const open = !!panelBlock;
  const b = panelBlock;
  const dept = b ? DEPTS[b.dept] : null;

  const handleOverride = () => {
    const reason = window.prompt(`Reason for override of ${b.id} (mandatory per SOP):`);
    if (!reason) return; // overrideBlock itself toasts the cancellation if called with empty reason, but skip the call entirely here to avoid a prompt-cancel toast
    overrideBlock(b, reason);
  };

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
                <Row k="Window" v={fmtWindow(b.start, b.dur)} />
                <Row k="Status" v={b.st} />
                <Row k="Source system" v={b.src} />
              </div>

              {b.conflict && (
                <div className="mt-3 text-[11.5px] px-3 py-2 rounded-md" style={{ background: '#FBEAE7', color: '#BB4430' }}>
                  ⚠ Overlaps {b.id === 'B-301' ? 'B-302' : b.id === 'B-302' ? 'B-301' : 'another block'} on this section — unresolved
                </div>
              )}

              <div className="mt-3 text-[11.5px] text-ink-500 leading-relaxed border-l-2 border-cream-300 pl-3">
                {b.note}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => approveBlock(b)}
                  className="flex-1 bg-cyan-600 text-white text-[12px] font-medium py-2 rounded-md hover:bg-cyan-700"
                >
                  Approve
                </button>
                {b.conflict && (
                  <button
                    onClick={() => {
                      setScreen('conflict');
                      setPanelBlock(null);
                    }}
                    className="flex-1 text-white text-[12px] font-medium py-2 rounded-md hover:opacity-90"
                    style={{ background: '#BB4430' }}
                  >
                    Resolve conflict →
                  </button>
                )}
                <button
                  onClick={handleOverride}
                  className="flex-1 border border-cream-300 text-ink-700 text-[12px] font-medium py-2 rounded-md hover:bg-cream-100"
                >
                  Override
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
