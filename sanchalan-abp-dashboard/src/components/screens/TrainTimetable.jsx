import React, { useEffect, useMemo, useState } from 'react';
import { apiJson } from '../../api/client.js';
import Card from '../ui/Card.jsx';
import { fmtWindow } from '../../utils.js';

const TYPE_BADGE = {
  SF:   { bg: 'bg-[#00B4D8]/20',  text: 'text-[#00B4D8]', border: 'border-[#00B4D8]/40', label: 'Superfast' },
  EXP:  { bg: 'bg-blue-900/60',   text: 'text-blue-300',   border: 'border-blue-700/50', label: 'Express' },
  RAJ:  { bg: 'bg-amber-900/60',  text: 'text-amber-300',  border: 'border-amber-700/50', label: 'Rajdhani' },
  PASS: { bg: 'bg-emerald-900/60',text: 'text-emerald-300',border: 'border-emerald-700/50', label: 'Passenger' },
  MEMU: { bg: 'bg-teal-900/60',   text: 'text-teal-300',   border: 'border-teal-700/50', label: 'MEMU' },
  DEMU: { bg: 'bg-purple-900/60', text: 'text-purple-300', border: 'border-purple-700/50', label: 'DEMU' },
};

export default function TrainTimetable() {
  const [data, setData] = useState({ sections: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSec, setSelectedSec] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Active prediction drawer for a selected train pass
  const [activeRow, setActiveRow] = useState(null);
  const [delayInputMins, setDelayInputMins] = useState(30);
  const [depthInput, setDepthInput] = useState(1);
  const [cascadeResult, setCascadeResult] = useState(null);
  const [cascadeLoading, setCascadeLoading] = useState(false);

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

  // Query ML Cascade Predictor when active row or inputs change
  useEffect(() => {
    if (!activeRow) { setCascadeResult(null); return; }
    setCascadeLoading(true);
    const delaySec = Math.max(60, delayInputMins * 60);
    apiJson(`/api/trains/cascade-impact?delay_received_seconds=${delaySec}&propagation_depth=${depthInput}&is_root=${depthInput === 0}`)
      .then(res => setCascadeResult(res))
      .catch(() => setCascadeResult(null))
      .finally(() => setCascadeLoading(false));
  }, [activeRow, delayInputMins, depthInput]);

  const filteredRows = useMemo(() => {
    return data.rows.filter((r) => {
      if (selectedType && r.train_type !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.trim().toLowerCase();
        const numMatch = String(r.train_number || '').toLowerCase().includes(q);
        const nameMatch = String(r.train_name || '').toLowerCase().includes(q);
        const fromMatch = String(r.from_name || '').toLowerCase().includes(q);
        const toMatch = String(r.to_name || '').toLowerCase().includes(q);
        const secMatch = String(r.sec || '').toLowerCase().includes(q);
        const typeMatch = String(r.train_type || '').toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !fromMatch && !toMatch && !secMatch && !typeMatch) return false;
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
    <div className="screen-enter space-y-4">
      {/* Filters and search bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedSec}
            onChange={(e) => setSelectedSec(e.target.value)}
            className="bg-[#101B2D] border border-[#26364D] rounded-md text-[11.5px] px-2.5 py-1.5 font-medium text-white outline-none focus:border-[#06B6D4] font-mono"
          >
            <option value="">All Corridor Sections</option>
            {data.sections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#101B2D] border border-[#26364D] rounded-md text-[11.5px] px-2.5 py-1.5 font-medium text-white outline-none focus:border-[#06B6D4] font-mono"
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
              placeholder="Search train #, name, route, section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#101B2D] border border-[#26364D] rounded-md text-[11.5px] pl-7 pr-3 py-1.5 w-64 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4] font-sans"
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
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-4 text-[11px] text-slate-300 bg-[#101B2D] border border-[#26364D] px-3 py-1.5 rounded-md font-mono">
          <span>Total Passes: <strong className="text-white">{stats.total}</strong></span>
          <span className="text-[#26364D]">•</span>
          <span>Unique Trains: <strong className="text-white">{stats.uniqueTrains}</strong></span>
          <span className="text-[#26364D]">•</span>
          <span>Mail/Express: <strong className="text-[#06B6D4]">{stats.sfExp}</strong></span>
          <span className="text-[#26364D]">•</span>
          <span>Local/Passenger: <strong className="text-emerald-400">{stats.pass}</strong></span>
        </div>
      </div>

      {loading ? (
        <Card className="bg-[#101B2D]">
          <div className="p-8 text-center text-[12px] text-slate-400 font-mono">
            Loading section timetable & path-holds...
          </div>
        </Card>
      ) : error ? (
        <Card className="bg-[#101B2D]">
          <div className="p-6 text-center text-[12px] text-red-400 font-medium font-mono">
            {error}
          </div>
        </Card>
      ) : filteredRows.length === 0 ? (
        <Card className="bg-[#101B2D]">
          <div className="p-8 text-center text-[12px] text-slate-400 font-mono">
            No train timetable records match your selected filters.
          </div>
        </Card>
      ) : (
        <Card className="bg-[#101B2D] overflow-hidden">
          <div
            className="grid text-[10px] uppercase tracking-wider text-slate-400 px-4 py-2.5 border-b border-[#26364D] font-mono font-bold bg-[#050B16] items-center gap-3"
            style={{ gridTemplateColumns: '80px 1.5fr 85px 1.5fr 100px 220px 60px' }}
          >
            <span>Train #</span>
            <span>Train Name</span>
            <span>Type</span>
            <span>Route</span>
            <span>Section</span>
            <span className="whitespace-nowrap">Section Pass Window</span>
            <span className="text-right">Day</span>
          </div>
          <div className="divide-y divide-[#26364D] max-h-[calc(100vh-220px)] overflow-y-auto">
            {filteredRows.map((r) => {
              const badge = TYPE_BADGE[r.train_type] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: r.train_type };
              const windowStr = fmtWindow(r.pass_start_h, r.pass_dur_h);
              const isExpanded = activeRow?.id === r.id;

              return (
                <React.Fragment key={r.id}>
                  <div
                    onClick={() => setActiveRow(isExpanded ? null : r)}
                    className={`grid items-center px-4 py-2.5 text-[11.5px] gap-3 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-[#142238] border-l-4 border-l-[#06B6D4]' : 'hover:bg-[#0B1424]'
                    }`}
                    style={{ gridTemplateColumns: '80px 1.5fr 85px 1.5fr 100px 220px 60px' }}
                  >
                    <span className="font-mono font-bold text-[#06B6D4] text-[12px]">{r.train_number}</span>
                    <span className="font-medium text-white truncate pr-1" title={r.train_name}>{r.train_name}</span>
                    <div>
                      <span className={`inline-block px-1.5 py-0.5 text-[9.5px] font-mono font-bold uppercase rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {r.train_type}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-300 truncate pr-1" title={`${r.from_name} → ${r.to_name}`}>
                      {r.from_name} → {r.to_name}
                    </span>
                    <span className="font-mono text-[10.5px] text-slate-200 font-semibold">{r.sec}</span>
                    <div>
                      <span className="font-mono text-[10.5px] text-cyan-300 bg-[#050B16] px-2 py-0.5 rounded inline-block whitespace-nowrap border border-[#26364D]">
                        {windowStr}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium text-right font-mono">Day {r.day}</span>
                  </div>

                  {/* ML Cascade Delay Predictor Drawer */}
                  {isExpanded && (
                    <div className="bg-[#0B1424] border-y border-[#26364D] p-4 text-[11.5px]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-violet-400">⚡</span>
                          <span className="font-semibold text-violet-200 font-display">
                            ML Cascade Delay Predictor · {r.train_number} {r.train_name}
                          </span>
                          <span className="text-[10px] bg-violet-900/40 text-violet-300 border border-violet-700/40 px-2 py-0.5 rounded font-mono">
                            R²=0.9289 · 171k cascade events
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveRow(null)}
                          className="text-[11px] font-mono text-slate-400 hover:text-white"
                        >
                          ✕ CLOSE
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 items-end bg-[#101B2D] border border-[#26364D] p-3.5 rounded-md">
                        <div>
                          <label className="block text-[10.5px] text-slate-400 mb-1 font-mono">
                            Disruption Delay: <strong className="text-white">{delayInputMins} mins</strong>
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            value={delayInputMins}
                            onChange={(e) => setDelayInputMins(Number(e.target.value))}
                            className="w-full accent-[#06B6D4]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] text-slate-400 mb-1 font-mono">
                            Cascade Hop Depth: <strong className="text-white">{depthInput === 0 ? '0 (Root)' : `Hop ${depthInput}`}</strong>
                          </label>
                          <select
                            value={depthInput}
                            onChange={(e) => setDepthInput(Number(e.target.value))}
                            className="w-full bg-[#050B16] border border-[#26364D] rounded px-2 py-1 text-[11px] text-white font-mono"
                          >
                            <option value={0}>Hop 0 — Root Disruption</option>
                            <option value={1}>Hop 1 — Adjacent Section</option>
                            <option value={2}>Hop 2 — Network Branch</option>
                            <option value={3}>Hop 3 — Secondary Corridor</option>
                            <option value={4}>Hop 4 — Distant Junction</option>
                          </select>
                        </div>

                        <div className="bg-[#142238] border border-[#26364D] rounded p-2.5 text-right font-mono">
                          <span className="text-[10px] text-violet-300 block uppercase font-bold tracking-wide">
                            Predicted Downstream Delay
                          </span>
                          {cascadeLoading ? (
                            <span className="text-slate-400 text-[11px]">Calculating...</span>
                          ) : cascadeResult ? (
                            <span className="text-lg font-mono font-bold text-violet-200">
                              +{cascadeResult.predicted_propagated_delay_minutes} mins
                              <span className="text-[10px] text-violet-400 font-normal ml-1">
                                ({cascadeResult.predicted_propagated_delay_seconds.toFixed(0)}s)
                              </span>
                            </span>
                          ) : (
                            <span className="text-red-400 text-[11px]">Unavailable</span>
                          )}
                        </div>
                      </div>

                      {cascadeResult?.rationale && (
                        <div className="mt-2.5 text-[10.5px] text-violet-300 bg-[#142238]/60 border-l-2 border-violet-400 pl-2.5 py-1 font-mono">
                          {cascadeResult.rationale}
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );

}
