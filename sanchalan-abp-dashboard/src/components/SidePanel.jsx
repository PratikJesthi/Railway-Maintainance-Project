import React from 'react';
import { useApp, SCREENS } from '../context/AppContext.jsx';
import { fmtWindow } from '../utils.js';

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-[#26364D] text-[12.5px]">
      <span className="text-slate-400 font-medium">{k}</span>
      <span className="num text-right font-semibold text-slate-100">{v}</span>
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
    if (!reason) return;
    overrideBlock(b, reason);
  };

  return (
    <>
      <div
        onClick={() => setPanelBlock(null)}
        className={
          'fixed inset-0 bg-[#050B16]/70 backdrop-blur-xs z-40 transition-opacity duration-200 ' +
          (open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
      />
      <aside
        className={
          'fixed top-0 right-0 h-full w-[380px] bg-[#0B1424] border-l border-[#26364D] shadow-[0_10px_40px_rgba(0,0,0,0.7)] z-50 transition-transform duration-200 ease-out overflow-y-auto ' +
          (open ? 'translate-x-0' : 'translate-x-full')
        }
      >
        {b && (
          <>
            <div className="flex items-center px-6 py-4 border-b border-[#26364D] bg-[#050B16]">
              <span className="font-bold text-[16px] text-white num tracking-wide">{b.id}</span>
              <button
                onClick={() => setPanelBlock(null)}
                className="ml-auto text-slate-400 hover:text-white text-xl leading-none w-7 h-7 rounded-full hover:bg-[#101B2D] flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-700/50"
                style={{ background: dept.tint, color: dept.text }}
              >
                <i className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dept.color }} />
                {dept.name.toUpperCase()}
              </span>

              <div className="bg-[#101B2D] p-4 rounded-md border border-[#26364D]">
                <Row k="Section" v={b.sec} />
                <Row k="Defect ID" v={b.defect} />
                <Row k="Severity" v={b.sev} />
                <Row k="Overdue" v={`${b.overdue} days`} />
                <Row k="Window" v={fmtWindow(b.start, b.dur)} />
                <Row k="Status" v={b.st} />
                <Row k="Source system" v={b.src} />
              </div>

              {b.conflict && (
                <div className="text-[12px] font-medium px-4 py-3 rounded-md border border-red-700/60 bg-red-950/40 text-red-300">
                  ⚠ Overlaps {b.id === 'B-301' ? 'B-302' : b.id === 'B-302' ? 'B-301' : 'another block'} on this section — unresolved
                </div>
              )}

              <div className="text-[12px] text-slate-300 leading-relaxed border-l-2 border-[#06B6D4] pl-3 py-1 font-normal bg-[#101B2D] rounded-r-md">
                {b.note}
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={() => approveBlock(b)}
                  className="w-full bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 text-[13px] font-bold py-2.5 rounded-md shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-mono"
                >
                  APPROVE BLOCK
                </button>
                {b.conflict && (
                  <button
                    onClick={() => {
                      setScreen('conflict');
                      setPanelBlock(null);
                    }}
                    className="w-full text-white bg-red-700 hover:bg-red-600 text-[13px] font-bold py-2.5 rounded-md shadow-sm transition-all font-mono"
                  >
                    RESOLVE CONFLICT →
                  </button>
                )}
                <button
                  onClick={handleOverride}
                  className="w-full border border-[#26364D] text-slate-300 hover:text-white text-[13px] font-semibold py-2.5 rounded-md hover:bg-[#101B2D] transition-all font-mono"
                >
                  OVERRIDE BLOCK
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

