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
    <div className="screen-enter">
      <div className="mb-3.5 text-[11px] text-ink-500">
        Every AI action, human override and what-if scenario is written here — append-only, exportable,
        COA-synced. Accountability is the point.
      </div>
      <Card>
        <div className="px-4 py-3 border-b border-cream-200 flex items-center gap-3">
          <span className="text-[12.5px] font-semibold text-ink-900">Audit Log</span>
          <span className="text-[11px] text-ink-500">append-only · synced to COA</span>
          <button
            onClick={exportAudit}
            className="ml-auto text-[10.5px] font-medium bg-cream-100 border border-cream-300 px-2.5 py-1 rounded-md hover:bg-cream-200"
          >
            ⬇ Export CSV
          </button>
        </div>
        <div>
          {audit.length === 0 && (
            <div className="p-8 text-center text-ink-500 text-[12px]">No audit entries yet</div>
          )}
          {audit.map((a, i) => (
            <div key={i} className="flex gap-2.5 px-4 py-2.5 border-b border-cream-200 last:border-b-0 text-[11.5px] items-start">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                style={{ background: a.type === 'warn' ? '#BB4430' : '#3E8E5B' }}
              />
              <div className="flex-1">
                <div>
                  <b className="num text-[10.5px] text-ink-500">{a.t}</b>
                  {' · '}
                  <b style={{ color: a.type === 'warn' ? '#A24A38' : '#2E6D44' }}>{a.action}</b>
                  {' · '}
                  <span className="text-ink-500">{a.by}</span>
                </div>
                <div className="text-ink-700 mt-0.5 leading-relaxed">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
