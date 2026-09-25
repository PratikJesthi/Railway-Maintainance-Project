import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';

const STATUS_STYLE = {
  Pending: 'bg-amber-950/60 text-amber-300 border border-amber-700/50',
  Scheduled: 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/50',
  'In Progress': 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50',
  Completed: 'bg-[#142238] text-slate-400 border border-[#26364D]',
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
    <div className="screen-enter space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="bg-[#101B2D] border border-[#26364D] rounded-md text-[12px] px-3 py-1.5 font-medium text-[#06B6D4] font-mono outline-none"
        >
          <option value="">All Departments</option>
          {Object.values(DEPTS).filter((d) => d.code !== 'Merged').map((d) => (
            <option key={d.code} value={d.code}>{d.name} ({d.short})</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[#101B2D] border border-[#26364D] rounded-md text-[12px] px-3 py-1.5 font-medium text-[#06B6D4] font-mono outline-none"
        >
          <option value="">All Statuses</option>
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
            className="bg-[#101B2D] border border-[#26364D] rounded-md text-[12px] pl-8 pr-3 py-1.5 w-60 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4] font-sans"
          />
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span className="ml-auto text-[11px] text-slate-400 font-mono font-medium max-w-md text-right">
          ML Priority Score = Severity + Overdue + Criticality + Safety Risk
        </span>
      </div>

      <div className="flex gap-4 text-[11px] font-mono font-bold text-slate-300 bg-[#101B2D] px-3 py-2 rounded-md border border-[#26364D]">
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2 rounded-xs inline-block bg-[#06B6D4]" />Severity (ENG)</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2 rounded-xs inline-block bg-[#F59E0B]" />Overdue Days</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2 rounded-xs inline-block bg-[#8B5CF6]" />Criticality (S&amp;T)</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2 rounded-xs inline-block bg-[#10B981]" />Safety Risk</span>
      </div>

      <Card className="bg-[#101B2D] overflow-hidden">
        <div className="grid text-[10px] uppercase tracking-wider text-slate-400 px-5 py-3 border-b border-[#26364D] font-mono font-bold bg-[#050B16] select-none"
             style={{ gridTemplateColumns: '40px 130px 100px 110px 110px 1fr 80px 70px 120px' }}>
          <span>#</span><span>Defect ID</span><span>Dept.</span><span>Section</span><span>Status</span>
          <span>Score Breakdown</span><span className="text-right">Score</span><span>Src</span><span className="text-right pr-2">Action</span>
        </div>
        {rows.map((q, i) => {
          const d = DEPTS[q.dept] || { short: q.dept, tint: '#142238', text: '#94A3B8' };
          const isExpanded = expandedId === q.id;

          return (
            <div key={q.id} className="border-b border-[#26364D]/60 last:border-b-0 transition-colors">
              <div
                onClick={() => toggleRow(q.id)}
                className={'grid items-center px-5 py-3 text-[12.5px] cursor-pointer hover:bg-[#0B1424] select-none transition-colors font-mono ' + (isExpanded ? 'bg-[#142238] font-bold' : '')}
                style={{ gridTemplateColumns: '40px 130px 100px 110px 110px 1fr 80px 70px 120px' }}
              >
                <span className={'num text-[14px] font-bold ' + (i === 0 ? 'text-red-400' : 'text-slate-400')}>{i + 1}</span>
                <span className="num font-bold text-white">{q.id}</span>
                <span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-700/40" style={{ background: d.tint, color: d.text }}>
                    {d.short}
                  </span>
                </span>
                <span className="text-slate-200 num text-[12px]">{q.sec}</span>
                <span>
                  <span className={'text-[10.5px] font-mono font-semibold px-2.5 py-0.5 rounded-full ' + (STATUS_STYLE[q.st] || 'bg-[#142238] text-slate-400')}>{q.st}</span>
                </span>
                <span className="flex h-2.5 rounded-sm overflow-hidden gap-px max-w-[200px] bg-[#050B16] border border-[#26364D]" title={`Severity: ${q.sev}, Overdue: ${q.ovd||0}, Crit: ${q.crit||0}, Safety: ${q.saf||0}`}>
                  <span style={{ width: `${Math.max(5, q.sev)}%`, background: '#06B6D4' }} />
                  <span style={{ width: `${q.ovd || 0}%`, background: '#F59E0B' }} />
                  <span style={{ width: `${q.crit || 0}%`, background: '#8B5CF6' }} />
                  <span style={{ width: `${q.saf || 0}%`, background: '#10B981' }} />
                </span>
                <span className={'num font-bold text-[14px] text-right ' + (i === 0 ? 'text-red-400' : 'text-white')}>{q.total}</span>
                <span className="num text-[9.5px] font-bold text-slate-400 border border-[#26364D] bg-[#050B16] px-1.5 py-0.5 rounded text-center w-fit uppercase">{q.src}</span>
                <span className="text-right pr-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(q.id);
                    }}
                    className="text-[11px] font-bold text-[#06B6D4] hover:text-cyan-300 transition-colors inline-flex items-center gap-1 font-mono uppercase"
                  >
                    {isExpanded ? '▲ LESS' : '▼ DETAILS'}
                  </button>
                </span>
              </div>

              {isExpanded && (
                <div className="px-6 py-4 bg-[#0B1424] border-t border-[#26364D] text-[12px] leading-relaxed space-y-3 font-mono">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[300px]">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#06B6D4] mb-1.5">
                        AI Rationale &amp; Priority Justification
                      </div>
                      <p className="text-[12px] text-slate-200 bg-[#050B16] p-3.5 rounded-md border border-[#26364D] leading-relaxed font-sans">
                        {q.why}
                      </p>
                    </div>

                    <div className="bg-[#050B16] border border-[#26364D] rounded-md p-3.5 min-w-[280px]">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 border-b border-[#26364D] pb-1">
                        Transparent Scoring Breakdown
                      </div>
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11.5px]">
                        <span className="text-slate-400 font-medium">Severity Weight:</span>
                        <span className="num font-bold text-[#06B6D4]">{q.sev} pts</span>
                        <span className="text-slate-400 font-medium">Overdue Days:</span>
                        <span className="num font-bold text-[#F59E0B]">+{q.ovd || 0} pts</span>
                        <span className="text-slate-400 font-medium">Section Criticality:</span>
                        <span className="num font-bold text-[#8B5CF6]">+{q.crit || 0} pts</span>
                        <span className="text-slate-400 font-medium">Safety Risk Factor:</span>
                        <span className="num font-bold text-emerald-400">+{q.saf || 0} pts</span>
                        <span className="text-slate-200 font-bold border-t border-[#26364D] pt-1.5 mt-0.5">Total Score:</span>
                        <span className="num font-bold text-red-400 border-t border-[#26364D] pt-1.5 mt-0.5">{q.total} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#26364D] text-[11px]">
                    <span className="text-slate-400">
                      Defect System Source: <strong className="num text-slate-200">{q.src}</strong> · Corridor: <strong className="text-slate-200">{q.sec}</strong>
                    </span>
                    <button
                      onClick={() => handleInspectOnTimeline(q.id)}
                      className="text-[11.5px] font-bold text-slate-950 bg-[#06B6D4] hover:bg-cyan-400 px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      INSPECT ON TIMELINE →
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

