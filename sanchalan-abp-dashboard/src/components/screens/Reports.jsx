import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useApp } from '../../context/AppContext.jsx';
import { apiJson } from '../../api/client.js';
import Card from '../ui/Card.jsx';

function download(filename, text) {
  const el = document.createElement('a');
  el.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  el.download = filename;
  el.click();
}

export default function Reports() {
  const { showToast } = useApp();
  const [utilData, setUtilData] = useState([]);
  const [backlogTrend, setBacklogTrend] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [rpKpis, setRpKpis] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiJson('/api/reports/utilization'),
      apiJson('/api/reports/backlog-trend'),
      apiJson('/api/reports/compliance'),
      apiJson('/api/reports/summary'),
    ]).then(([util, backlog, comp, summary]) => {
      if (cancelled) return;
      setUtilData(util);
      setBacklogTrend(backlog);
      setCompliance(comp);
      setRpKpis(summary);
    }).catch((err) => showToast(`✗ Reports failed to load: ${err.message}`));
    return () => { cancelled = true; };
  }, [showToast]);

  const exportSummary = () => {
    const csv = 'department,utilisation_pct\n' + utilData.map((d) => `${d.dept},${d.value}`).join('\n');
    download('sanchalan_summary.csv', csv);
    showToast('⬇ sanchalan_summary.csv downloaded');
  };
  const exportBacklog = () => {
    const csv = 'week,backlog\n' + backlogTrend.map((d) => `${d.week},${d.backlog}`).join('\n');
    download('sanchalan_backlog_trend.csv', csv);
    showToast('⬇ sanchalan_backlog_trend.csv downloaded');
  };

  // Dark chart styles
  const chartGrid = '#26364D';
  const axisText = '#94A3B8';
  const tooltip = { fontSize: 12, borderRadius: 6, background: '#0B1424', border: '1px solid #26364D', color: '#E2E8F0' };

  return (
    <div className="screen-enter space-y-4">
      {/* Report Header */}
      <div className="relative rounded-md border border-[#26364D] bg-[#0B1424]/85 backdrop-blur-md p-5 shadow-lg overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-[#06B6D4]">
                CENTRAL RAILWAY DIVISIONAL ANALYTICS &amp; COMPLIANCE
              </span>
            </div>
            <h2 className="text-xl font-bold text-white font-display">
              SANCHALAN Performance Reports &amp; SLA Analytics
            </h2>
          </div>

          <div className="flex gap-2">
            <button onClick={exportSummary}
              className="text-[11.5px] font-mono font-bold text-slate-950 px-3.5 py-1.5 rounded-md bg-[#06B6D4] hover:bg-cyan-400 transition-all shadow-sm">
              ⬇ EXPORT SUMMARY CSV
            </button>
            <button onClick={exportBacklog}
              className="text-[11.5px] font-mono font-semibold bg-[#101B2D] border border-[#26364D] text-slate-200 hover:text-white px-3.5 py-1.5 rounded-md hover:bg-[#142238] transition-all">
              ⬇ BACKLOG CSV
            </button>
            <button onClick={() => window.print()}
              className="text-[11.5px] font-mono font-semibold bg-[#101B2D] border border-[#26364D] text-slate-200 hover:text-white px-3.5 py-1.5 rounded-md hover:bg-[#142238] transition-all">
              ⎙ PRINT PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3.5">
        {rpKpis.map((k) => (
          <Card key={k.label} className="p-4 bg-[#101B2D] border border-[#26364D]">
            <div className="num text-[22px] font-bold text-white tracking-tight">{k.value}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono uppercase font-bold">{k.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-[#101B2D]">
          <div className="px-4 py-3 border-b border-[#26364D] text-[12.5px] font-bold text-slate-100 font-display">
            Block Utilisation by Department
          </div>
          <div className="p-3" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilData}>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 11, fill: axisText }} axisLine={{ stroke: '#26364D' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: axisText }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltip} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-[#101B2D]">
          <div className="px-4 py-3 border-b border-[#26364D] flex items-center justify-between">
            <span className="text-[12.5px] font-bold text-slate-100 font-display">Defect Backlog Trend</span>
            <span className="text-[11px] font-mono text-slate-400">last 14 weeks</span>
          </div>
          <div className="p-3" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={backlogTrend}>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: axisText }} axisLine={{ stroke: '#26364D' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: axisText }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltip} />
                <Line type="monotone" dataKey="backlog" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-2 bg-[#101B2D]">
          <div className="px-4 py-3 border-b border-[#26364D] flex items-center justify-between">
            <span className="text-[12.5px] font-bold text-slate-100 font-display">Department-wise Compliance</span>
            <span className="text-[11px] font-mono text-slate-400">block window adherence %</span>
          </div>
          <div className="p-3" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compliance} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke={chartGrid} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: axisText }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: axisText }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={tooltip} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );

}
