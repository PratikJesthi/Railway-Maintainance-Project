import React, { useEffect, useMemo, useState } from 'react';
import { apiJson } from '../../api/client.js';
import Card from '../ui/Card.jsx';
import { fmtWindow } from '../../utils.js';

const TYPE_BADGE = {
  SF:   { bg: 'bg-cyan-900/60',   text: 'text-cyan-200',   border: 'border-cyan-700/50', label: 'Superfast' },
  EXP:  { bg: 'bg-blue-900/60',   text: 'text-blue-200',   border: 'border-blue-700/50', label: 'Express' },
  RAJ:  { bg: 'bg-amber-900/60',  text: 'text-amber-200',  border: 'border-amber-700/50', label: 'Rajdhani' },
  PASS: { bg: 'bg-emerald-900/60',text: 'text-emerald-200',border: 'border-emerald-700/50', label: 'Passenger' },
  MEMU: { bg: 'bg-teal-900/60',   text: 'text-teal-200',   border: 'border-teal-700/50', label: 'MEMU' },
  DEMU: { bg: 'bg-purple-900/60', text: 'text-purple-200', border: 'border-purple-700/50', label: 'DEMU' },
};

export default function TrainTimetable() {
  const [data, setData] = useState({ sections: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSec, setSelectedSec] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const url = selectedSec ? `/api/trains/timetable?sec=${encodeURIComponent(selectedSec)}` : '/api/trains/timetable';
    apiJson(url)
      .then((res) => {
        if (!cancelled) {
          setData(res || { sections: [], rows: [] });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load train timetable.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [selectedSec]);

  const filteredRows = useMemo(() => {
    return data.rows.filter((r) => {
      if (selectedType && r.train_type !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const numMatch = r.train_number.toLowerCase().includes(q);
        const nameMatch = r.train_name.toLowerCase().includes(q);
        const fromMatch = (r.from_name || '').toLowerCase().includes(q);
        const toMatch = (r.to_name || '').toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !fromMatch && !toMatch) return false;
      }
      return true;
    });
  }, [data.rows, selectedType, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredRows.length;
    const sfExp = filteredRows.filter((r) => ['SF', 'EXP', 'RAJ'].includes(r.train_type)).length;
    const pass = filteredRows.filter((r) => ['PASS', 'MEMU', 'DEMU'].includes(r.train_type)).length;
    const uniqueTrains = new Set(filteredRows.map((r) => r.train_number)).size;
    return { total, sfExp, pass, uniqueTrains };
  }, [filteredRows]);

  return (
    <div className="screen-enter">
      {/* Filters and search bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedSec}
            onChange={(e) => setSelectedSec(e.target.value)}
            className="bg-cream-50 border border-cream-300 rounded-md text-[11.5px] px-2.5 py-1.5 font-medium text-ink-900"
          >
            <option value="">All Corridor Sections</option>
            {data.sections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-cream-50 border border-cream-300 rounded-md text-[11.5px] px-2.5 py-1.5 font-medium text-ink-900"
          >
            <option value="">All Train Types</option>
            <option value="SF">Superfast (SF)</option>
            <option value="EXP">Express (EXP)</option>
            <option value="RAJ">Rajdhani (RAJ)</option>
            <option value="PASS">Passenger (PASS)</option>
            <option value="MEMU">MEMU</option>
            <option value="DEMU">DEMU</option>
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Search train #, name, route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-cream-50 border border-cream-300 rounded-md text-[11.5px] pl-7 pr-3 py-1.5 w-60 text-ink-900 placeholder:text-ink-500/60"
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
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-4 text-[11px] text-ink-500 bg-cream-100/70 border border-cream-300 px-3 py-1.5 rounded-md">
          <span>Total Section Passes: <strong className="text-ink-900">{stats.total}</strong></span>
          <span className="text-cream-400">•</span>
          <span>Unique Trains: <strong className="text-ink-900">{stats.uniqueTrains}</strong></span>
          <span className="text-cream-400">•</span>
          <span>Mail/Express: <strong className="text-cyan-700">{stats.sfExp}</strong></span>
          <span className="text-cream-400">•</span>
          <span>Local/Passenger: <strong className="text-emerald-700">{stats.pass}</strong></span>
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="p-8 text-center text-[12px] text-ink-500">
            Loading section timetable & path-holds...
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="p-6 text-center text-[12px] text-red-600 font-medium">
            {error}
          </div>
        </Card>
      ) : filteredRows.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-[12px] text-ink-500">
            No train timetable records match your selected filters.
          </div>
        </Card>
      ) : (
        <Card>
          <div
            className="grid text-[10px] uppercase tracking-wide text-ink-500 px-4 py-2.5 border-b border-cream-200 font-semibold bg-cream-100/50 items-center"
            style={{ gridTemplateColumns: '75px 1fr 70px 150px 95px 195px 50px' }}
          >
            <span>Train #</span>
            <span>Train Name</span>
            <span>Type</span>
            <span>Route</span>
            <span>Section</span>
            <span className="whitespace-nowrap">Section Pass Window</span>
            <span>Day</span>
          </div>
          <div className="divide-y divide-cream-200 max-h-[calc(100vh-220px)] overflow-y-auto">
            {filteredRows.map((r) => {
              const badge = TYPE_BADGE[r.train_type] || { bg: 'bg-gray-800', text: 'text-gray-200', border: 'border-gray-700', label: r.train_type };
              const windowStr = fmtWindow(r.pass_start_h, r.pass_dur_h);
              return (
                <div
                  key={r.id}
                  className="grid items-center px-4 py-2.5 text-[11.5px] hover:bg-cream-100/60 transition-colors"
                  style={{ gridTemplateColumns: '75px 1fr 70px 150px 95px 195px 50px' }}
                >
                  <span className="font-mono font-semibold text-cyan-800 text-[12px]">{r.train_number}</span>
                  <span className="font-medium text-ink-900 truncate pr-2" title={r.train_name}>{r.train_name}</span>
                  <span>
                    <span className={`inline-block px-1.5 py-0.5 text-[9.5px] font-bold uppercase rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {r.train_type}
                    </span>
                  </span>
                  <span className="text-[10.5px] text-ink-700 truncate pr-2" title={`${r.from_name} → ${r.to_name}`}>
                    {r.from_name} → {r.to_name}
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-800 font-medium">{r.sec}</span>
                  <span>
                    <span className="font-mono text-[10.5px] text-ink-700 bg-cream-200/50 px-2 py-0.5 rounded inline-block whitespace-nowrap">
                      {windowStr}
                    </span>
                  </span>
                  <span className="text-[10.5px] text-ink-500 font-medium">Day {r.day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
