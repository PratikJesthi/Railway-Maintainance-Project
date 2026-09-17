import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useApp } from '../../context/AppContext.jsx';
import { DEPTS } from '../../data/opsData';
import Card from '../ui/Card.jsx';

const UTIL_DATA = [
  { dept: 'Engg.', value: 78 },
  { dept: 'Traction', value: 64 },
  { dept: 'S&T', value: 71 },
  { dept: 'Combined', value: 88 },
];

const BACKLOG_TREND = Array.from({ length: 14 }, (_, i) => ({
  week: `W${i + 1}`,
  backlog: Math.round(210 - i * 6 + Math.sin(i) * 10),
}));

const COMPLIANCE = [
  { dept: 'Engg.', value: 91 },
  { dept: 'Traction', value: 86 },
  { dept: 'S&T', value: 94 },
  { dept: 'BDMS-flagged', value: 78 },
];

const RP_KPIS = [
  { label: 'Blocks planned this month', value: '412' },
  { label: 'Avg. possession utilisation', value: '81%' },
  { label: 'SLA-breach incidents', value: '6' },
  { label: 'Conflicts auto-resolved', value: '63' },
];

function download(filename, text) {
  const el = document.createElement('a');
  el.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  el.download = filename;
  el.click();
}

export default function Reports() {
  const { showToast } = useApp();

  const exportSummary = () => {
    const csv = 'department,utilisation_pct\n' + UTIL_DATA.map((d) => `${d.dept},${d.value}`).join('\n');
    download('sanchalan_summary.csv', csv);
    showToast('⬇ sanchalan_summary.csv downloaded');
  };
  const exportBacklog = () => {
    const csv = 'week,backlog\n' + BACKLOG_TREND.map((d) => `${d.week},${d.backlog}`).join('\n');
    download('sanchalan_backlog_trend.csv', csv);
    showToast('⬇ sanchalan_backlog_trend.csv downloaded');
  };

  return (
    <div className="screen-enter">
      <div className="grid grid-cols-4 gap-3.5 mb-3.5">
        {RP_KPIS.map((k) => (
          <Card key={k.label} className="p-3.5">
            <div className="num text-[22px] font-semibold text-ink-900">{k.value}</div>
            <div className="text-[11px] text-ink-500 mt-1">{k.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Card>
          <div className="px-4 py-3 border-b border-cream-200 text-[12.5px] font-semibold text-ink-900">
            Block Utilisation by Department
          </div>
          <div className="p-3" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={UTIL_DATA}>
                <CartesianGrid stroke="#F0E7CE" vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#7A7460' }} axisLine={{ stroke: '#E4D6AF' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A7460' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4D6AF' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#3AACA3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-cream-200 flex items-center">
            <span className="text-[12.5px] font-semibold text-ink-900">Defect Backlog Trend</span>
            <span className="ml-auto text-[11px] text-ink-500">last 14 weeks</span>
          </div>
          <div className="p-3" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={BACKLOG_TREND}>
                <CartesianGrid stroke="#F0E7CE" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#7A7460' }} axisLine={{ stroke: '#E4D6AF' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A7460' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4D6AF' }} />
                <Line type="monotone" dataKey="backlog" stroke="#B9812C" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-2">
          <div className="px-4 py-3 border-b border-cream-200 flex items-center">
            <span className="text-[12.5px] font-semibold text-ink-900">Department-wise Compliance</span>
            <span className="ml-auto text-[11px] text-ink-500">block window adherence %</span>
          </div>
          <div className="p-3" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COMPLIANCE} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#F0E7CE" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#7A7460' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: '#7A7460' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4D6AF' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#0F7A73" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="flex gap-2.5 items-center mt-3.5">
        <button onClick={exportSummary} className="text-[11.5px] font-medium text-white px-3.5 py-2 rounded-md" style={{ background: '#0F7A73' }}>
          ⬇ Export summary CSV
        </button>
        <button onClick={exportBacklog} className="text-[11.5px] font-medium bg-cream-50 border border-cream-300 px-3.5 py-2 rounded-md hover:bg-cream-200">
          ⬇ Backlog trend CSV
        </button>
        <button onClick={() => window.print()} className="text-[11.5px] font-medium bg-cream-50 border border-cream-300 px-3.5 py-2 rounded-md hover:bg-cream-200">
          ⎙ Export PDF (print)
        </button>
        <span className="ml-auto text-[11px] text-ink-500">
          Exports are generated client-side from the same JSON the FastAPI backend serves.
        </span>
      </div>
    </div>
  );
}
