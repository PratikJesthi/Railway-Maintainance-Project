import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';

const STATUS_STYLE = {
  Pending: 'bg-[#FBF1DE] text-[#8A6120]',
  Scheduled: 'bg-cyan-100 text-cyan-700',
  'In Progress': 'bg-[#EAF6EE] text-[#2E6D44]',
};

export default function PriorityQueue() {
  const { queue, depts: DEPTS } = useApp();
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');

  const rows = useMemo(() => {
    return queue
      .filter((q) => !dept || DEPTS[q.dept].name === dept)
      .filter((q) => !status || q.st === status)
      .map((q) => ({ ...q, total: q.sev }))
      .sort((a, b) => b.total - a.total);
  }, [queue, dept, status]);

  return (
    <div className="screen-enter">
      <div className="flex flex-wrap gap-2.5 mb-3.5 items-center">
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="bg-cream-50 border border-cream-300 rounded-md text-[11.5px] px-2.5 py-1.5"
        >
          <option value="">All departments</option>
          {Object.values(DEPTS).filter((d) => d.code !== 'Merged').map((d) => (
            <option key={d.code}>{d.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-cream-50 border border-cream-300 rounded-md text-[11.5px] px-2.5 py-1.5"
        >
          <option value="">All statuses</option>
          <option>Pending</option>
          <option>Scheduled</option>
          <option>In Progress</option>
        </select>
        <span className="ml-auto text-[11px] text-ink-500 max-w-md text-right">
          ML priority score = severity + overdue + criticality + safety risk — fully transparent, no black box.
        </span>
      </div>

      <div className="flex gap-4 mb-2.5 text-[10.5px] text-ink-500">
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2 rounded-sm inline-block" style={{ background: '#3AACA3' }} />Severity</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2 rounded-sm inline-block" style={{ background: '#B9812C' }} />Overdue days</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2 rounded-sm inline-block" style={{ background: '#7C5AA6' }} />Criticality</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2 rounded-sm inline-block" style={{ background: '#4C8F8A' }} />Safety risk</span>
      </div>

      <Card>
        <div className="grid text-[10px] uppercase tracking-wide text-ink-500 px-4 py-2 border-b border-cream-200"
             style={{ gridTemplateColumns: '38px 130px 100px 110px 80px 1fr 80px 56px 120px' }}>
          <span>#</span><span>Defect</span><span>Dept.</span><span>Section</span><span>Status</span>
          <span>Score breakdown</span><span>Score</span><span>Src</span><span>Rationale</span>
        </div>
        {rows.map((q, i) => {
          const d = DEPTS[q.dept];
          return (
            <div key={q.id} className="border-b border-cream-200 last:border-b-0">
              <div
                className="grid items-center px-4 py-2.5 text-[11.5px]"
                style={{ gridTemplateColumns: '38px 130px 100px 110px 80px 1fr 80px 56px 120px' }}
              >
                <span className={'num text-[15px] font-semibold ' + (i === 0 ? 'text-[#BB4430]' : 'text-ink-500')}>{i + 1}</span>
                <span className="font-medium text-ink-900">{q.id}</span>
                <span>
                  <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded" style={{ background: d.tint, color: d.text }}>
                    {d.short}
                  </span>
                </span>
                <span className="text-ink-700">{q.sec}</span>
                <span>
                  <span className={'text-[10px] font-semibold px-2 py-0.5 rounded-full ' + STATUS_STYLE[q.st]}>{q.st}</span>
                </span>
                <span className="flex h-2.5 rounded overflow-hidden gap-px">
                  <span style={{ width: `${q.sev}%`, background: '#3AACA3' }} />
                  <span style={{ width: `${q.ovd}%`, background: '#B9812C' }} />
                  <span style={{ width: `${q.crit}%`, background: '#7C5AA6' }} />
                  <span style={{ width: `${q.saf}%`, background: '#4C8F8A' }} />
                </span>
                <span className={'num font-semibold text-[13px] ' + (i === 0 ? 'text-[#BB4430]' : 'text-ink-900')}>{q.total}</span>
                <span className="font-mono text-[9.5px] text-ink-500 border border-cream-300 px-1 py-0.5 rounded text-center">{q.src}</span>
                <span className="text-ink-500 text-[10.5px] truncate">tap to expand</span>
              </div>
              <div className="px-4 pb-2.5 -mt-1 text-[10.5px] text-ink-500 pl-[54px]">
                <b className="text-ink-700">Why: </b>{q.why}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
