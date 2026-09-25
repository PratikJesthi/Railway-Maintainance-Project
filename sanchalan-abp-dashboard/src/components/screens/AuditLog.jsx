import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';

export default function AuditLog() {
  const { audit, showToast } = useApp();

  const exportAudit = () => {
    const csv =
      'time,by,action,detail\n' +
      audit.map((a) => `"${a.t}","${a.by}","${a.action}","${a.detail.replace(/"/g, '""')}"`).join('\n') + '\n';
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    el.download = 'sanchalan_audit_log.csv';
    el.click();
    showToast('⬇ sanchalan_audit_log.csv downloaded');
  };

  return (
    <div className="screen-enter space-y-3.5 font-mono">
      <div className="text-[12px] text-slate-400 font-sans">
        Every AI solver decision, human operational override, and what-if simulation is recorded here — append-only, exportable, COA-synced.
      </div>
      <Card className="bg-[#101B2D] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#26364D] bg-[#050B16] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-bold text-white font-display">Audit Log &amp; Governance Ledger</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#06B6D4]">APPEND-ONLY · SYNCED TO COA</span>
          </div>
          <button
            onClick={exportAudit}
            className="text-[11.5px] font-bold font-mono bg-[#101B2D] border border-[#26364D] text-[#06B6D4] hover:text-white px-3 py-1.5 rounded-md hover:bg-[#142238] transition-all"
          >
            ⬇ EXPORT AUDIT CSV
          </button>
        </div>
        <div className="divide-y divide-[#26364D]/60 font-mono">
          {audit.length === 0 && (
            <div className="p-10 text-center text-slate-500 text-[13px] font-mono">No audit entries recorded yet</div>
          )}
          {audit.map((a, i) => (
            <div key={i} className="flex gap-3 px-5 py-3 text-[12.5px] items-start hover:bg-[#0B1424] transition-colors">
              <span
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type === 'warn' ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ boxShadow: a.type === 'warn' ? '0 0 6px #EF4444' : '0 0 6px #10B981' }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="num text-[11px] font-semibold text-[#06B6D4]">{a.t}</span>
                  <span className="text-[#26364D]">•</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${a.type === 'warn' ? 'bg-red-950/60 text-red-300 border border-red-700/50' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'}`}>
                    {a.action}
                  </span>
                  <span className="text-[#26364D]">•</span>
                  <span className="text-slate-400 text-[11.5px] font-medium">{a.by}</span>
                </div>
                <div className="text-slate-200 mt-1 leading-relaxed font-sans text-[12px]">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

