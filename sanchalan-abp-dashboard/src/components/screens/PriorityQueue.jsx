import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';

const STATUS_STYLE = {
  Pending: 'bg-[#FBF1DE] text-[#8A6120]',
  Scheduled: 'bg-cyan-100 text-cyan-700',
  'In Progress': 'bg-[#EAF6EE] text-[#2E6D44]',
  Completed: 'bg-cream-200 text-ink-700',
};

export default function PriorityQueue() {
  const { queue, depts: DEPTS, setScreen, setPanelBlock, blocks } = useApp();
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const rows = useMemo(() => {
    return queue
      .filter((q) => {
        if (!dept) return true;
        const dObj = DEPTS[q.dept];
        return q.dept === dept || dObj?.code === dept || dObj?.name === dept || dObj?.short === dept;
      })
      .filter((q) => {
        if (!status) return true;
        return q.st === status;
      })
      .filter((q) => {
        if (!searchQuery) return true;
        const query = searchQuery.trim().toLowerCase();
        const idMatch = String(q.id || '').toLowerCase().includes(query);
        const secMatch = String(q.sec || '').toLowerCase().includes(query);
        const srcMatch = String(q.src || '').toLowerCase().includes(query);
        const whyMatch = String(q.why || '').toLowerCase().includes(query);
        return idMatch || secMatch || srcMatch || whyMatch;
      })
      .map((q) => ({ ...q, total: (q.sev || 0) + (q.ovd || 0) + (q.crit || 0) + (q.saf || 0) }))
      .sort((a, b) => b.total - a.total);
  }, [queue, dept, status, searchQuery, DEPTS]);

  const toggleRow = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleInspectOnTimeline = (defectId) => {
    const matchingBlock = blocks.find((b) => b.defect === defectId || b.id === defectId);
    if (matchingBlock) {
      setPanelBlock(matchingBlock);
    }
    setScreen('timeline');
  };

  return (
    <div className="screen-enter">
      <div className="flex flex-wrap gap-2.5 mb-3.5 items-center">
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="bg-cream-50 border border-cream-300 rounded-md text-[11.5px] px-2.5 py-1.5 font-medium text-ink-900"
        >
          <option value="">All departments</option>
          {Object.values(DEPTS).filter((d) => d.code !== 'Merged').map((d) => (
            <option key={d.code} value={d.code}>{d.name} ({d.short})</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-cream-50 border border-cream-300 rounded-md text-[11.5px] px-2.5 py-1.5 font-medium text-ink-900"
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <div className="relative">
          <input
            type="text"
            placeholder="Search defect ID, section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-cream-50 border border-cream-300 rounded-md text-[11.5px] pl-7 pr-3 py-1.5 w-52 text-ink-900 placeholder:text-ink-500/60 focus:outline-none focus:border-cyan-600"
          />
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
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
        <div className="grid text-[10px] uppercase tracking-wide text-ink-500 px-4 py-2 border-b border-cream-200 font-semibold bg-cream-100/50"
             style={{ gridTemplateColumns: '38px 130px 100px 110px 80px 1fr 70px 60px 110px' }}>
          <span>#</span><span>Defect ID</span><span>Dept.</span><span>Section</span><span>Status</span>
          <span>Score breakdown</span><span>Score</span><span>Src</span><span className="text-right pr-2">Action</span>
        </div>
        {rows.map((q, i) => {
          const d = DEPTS[q.dept] || { short: q.dept, tint: '#eee', text: '#333' };
          const isExpanded = expandedId === q.id;

          return (
            <div key={q.id} className="border-b border-cream-200 last:border-b-0 transition-colors">
              <div
                onClick={() => toggleRow(q.id)}
                className={'grid items-center px-4 py-2.5 text-[11.5px] cursor-pointer hover:bg-cream-100/70 select-none ' + (isExpanded ? 'bg-cream-100/90' : '')}
                style={{ gridTemplateColumns: '38px 130px 100px 110px 80px 1fr 70px 60px 110px' }}
              >
                <span className={'num text-[15px] font-semibold ' + (i === 0 ? 'text-[#BB4430]' : 'text-ink-500')}>{i + 1}</span>
                <span className="font-mono font-semibold text-ink-900">{q.id}</span>
                <span>
                  <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded" style={{ background: d.tint, color: d.text }}>
                    {d.short}
                  </span>
                </span>
                <span className="text-ink-700 font-mono text-[11px]">{q.sec}</span>
                <span>
                  <span className={'text-[10px] font-semibold px-2 py-0.5 rounded-full ' + (STATUS_STYLE[q.st] || 'bg-cream-200 text-ink-700')}>{q.st}</span>
                </span>
                <span className="flex h-2.5 rounded overflow-hidden gap-px max-w-[200px]" title={`Severity: ${q.sev}, Overdue: ${q.ovd||0}, Crit: ${q.crit||0}, Safety: ${q.saf||0}`}>
                  <span style={{ width: `${Math.max(5, q.sev)}%`, background: '#3AACA3' }} />
                  <span style={{ width: `${q.ovd || 0}%`, background: '#B9812C' }} />
                  <span style={{ width: `${q.crit || 0}%`, background: '#7C5AA6' }} />
                  <span style={{ width: `${q.saf || 0}%`, background: '#4C8F8A' }} />
                </span>
                <span className={'num font-semibold text-[13px] ' + (i === 0 ? 'text-[#BB4430]' : 'text-ink-900')}>{q.total}</span>
                <span className="font-mono text-[9.5px] text-ink-500 border border-cream-300 px-1 py-0.5 rounded text-center w-fit">{q.src}</span>
                <span className="text-right pr-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(q.id);
                    }}
                    className="text-[10.5px] font-medium text-cyan-700 hover:text-cyan-900 hover:underline inline-flex items-center gap-1"
                  >
                    {isExpanded ? '▲ collapse' : '▼ tap to expand'}
                  </button>
                </span>
              </div>

              {/* Expanded Details Drawer */}
              {isExpanded && (
                <div className="px-5 py-3.5 bg-cream-100/50 border-t border-cream-200 text-[11px] leading-relaxed text-ink-800 space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[300px]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">
                        AI Rationale & Priority Justification
                      </div>
                      <p className="text-[11.5px] text-ink-900 bg-white/80 p-2.5 rounded border border-cream-300 shadow-xs">
                        {q.why}
                      </p>
                    </div>

                    <div className="bg-white/80 border border-cream-300 rounded p-2.5 min-w-[240px]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1.5 border-b border-cream-200 pb-1">
                        Transparent Scoring Breakdown
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-[10.5px]">
                        <span className="text-ink-500">Severity Weight:</span>
                        <span className="font-mono font-semibold text-cyan-700">{q.sev} pts</span>
                        <span className="text-ink-500">Overdue Days:</span>
                        <span className="font-mono font-semibold text-amber-700">+{q.ovd || 0} pts</span>
                        <span className="text-ink-500">Section Criticality:</span>
                        <span className="font-mono font-semibold text-purple-700">+{q.crit || 0} pts</span>
                        <span className="text-ink-500">Safety Risk Factor:</span>
                        <span className="font-mono font-semibold text-teal-700">+{q.saf || 0} pts</span>
                        <span className="text-ink-900 font-bold border-t border-cream-200 pt-1 mt-0.5">Total Score:</span>
                        <span className="font-mono font-bold text-[#BB4430] border-t border-cream-200 pt-1 mt-0.5">{q.total} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-cream-200 text-[10.5px]">
                    <span className="text-ink-500">
                      Defect System Source: <strong className="font-mono text-ink-700">{q.src}</strong> · Corridor: <strong className="text-ink-700">{q.sec}</strong>
                    </span>
                    <button
                      onClick={() => handleInspectOnTimeline(q.id)}
                      className="text-[10.5px] font-semibold text-white bg-cyan-700 hover:bg-cyan-800 px-3 py-1 rounded shadow-soft transition-colors flex items-center gap-1"
                    >
                      Inspect on Timeline →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
