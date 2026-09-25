import React from 'react';

export default function RailwayCorridorMap({ className = '' }) {
  const stations = [
    { code: 'NDLS', name: 'New Delhi', km: 0, st: 'GREEN', label: 'Clear / Normal Ops', train: '12002 SHATABDI' },
    { code: 'MTJ', name: 'Mathura Jn', km: 141, st: 'TEAL', label: 'Eng (P.Way) Block', train: '12626 KERALA' },
    { code: 'AGC', name: 'Agra Cantt', km: 195, st: 'GREEN', label: 'Clear Corridor', train: '12722 DAKSHIN' },
    { code: 'GWL', name: 'Gwalior Jn', km: 313, st: 'VIOLET', label: 'S&T Interlocking', train: '12616 GRAND TRUNK' },
    { code: 'JHS', name: 'Jhansi Jn', km: 411, st: 'RED', label: 'Conflict Warning', train: '12804 SAMTA' },
    { code: 'BPL', name: 'Bhopal Jn', km: 703, st: 'AMBER', label: 'OHE Possession', train: '22692 RAJDHANI' },
    { code: 'ET', name: 'Itarsi Jn', km: 795, st: 'GREEN', label: 'Yard Handover', train: '12138 PUNJAB MAIL' },
  ];

  const STATUS_CONFIG = {
    GREEN: { color: '#10B981', bg: '#10B98115', border: '#10B98140', text: 'Clear', badge: 'bg-emerald-500/20 text-emerald-300' },
    TEAL: { color: '#06B6D4', bg: '#06B6D415', border: '#06B6D440', text: 'Active P.Way', badge: 'bg-cyan-500/20 text-cyan-300' },
    AMBER: { color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B40', text: 'OHE Possession', badge: 'bg-amber-500/20 text-amber-300' },
    RED: { color: '#EF4444', bg: '#EF444415', border: '#EF444440', text: 'Conflict', badge: 'bg-red-500/20 text-red-300 animate-pulse' },
    VIOLET: { color: '#8B5CF6', bg: '#8B5CF615', border: '#8B5CF640', text: 'S&T Work', badge: 'bg-purple-500/20 text-purple-300' },
  };

  return (
    <div className={`bg-[#0B1424]/85 backdrop-blur-md border border-[#26364D] rounded-md p-5 shadow-xl relative overflow-hidden ${className}`}>
      {/* Network Header & Legend */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 mb-4 border-b border-[#26364D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse shadow-[0_0_8px_#06B6D4]" />
            <h3 className="text-[15px] font-bold text-white font-display uppercase tracking-wider">
              Central Railway Mainline Corridor Diagram
            </h3>
          </div>
          <p className="text-[12px] text-slate-300 font-mono">
            NDLS → BPL → ET (795 km) · Live Section Status &amp; Track Possession Map
          </p>
        </div>

        {/* Live Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono font-semibold bg-[#050B16]/90 px-3 py-1.5 rounded border border-[#26364D]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> GREEN = Clear</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> TEAL = P.Way</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> AMBER = OHE</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> RED = Conflict</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> VIOLET = S&amp;T</span>
        </div>
      </div>

      {/* Corridor Visual Diagram */}
      <div className="relative py-6 px-2 overflow-x-auto">
        {/* Track Lines SVG */}
        <div className="relative min-w-[700px]">
          {/* Parallel Rails */}
          <div className="absolute top-[48px] left-8 right-8 h-3 flex flex-col justify-between pointer-events-none">
            <div className="h-[2px] w-full bg-[#334155] border-t border-[#475569]" />
            <div className="h-[2px] w-full bg-[#334155] border-t border-[#475569]" />
          </div>

          {/* Station Nodes Grid */}
          <div className="grid grid-cols-7 gap-2 relative z-10">
            {stations.map((s, idx) => {
              const cfg = STATUS_CONFIG[s.st];
              return (
                <div key={s.code} className="flex flex-col items-center text-center group">
                  {/* Station Tag & KM */}
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                    {s.km} KM
                  </span>

                  {/* Node Circle Signal */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform duration-200 group-hover:scale-110 cursor-pointer relative"
                    style={{ backgroundColor: '#050B16', borderColor: cfg.color, boxShadow: `0 0 12px ${cfg.color}50` }}
                  >
                    <span className="font-mono font-bold text-[12px] text-white tracking-wider">{s.code}</span>
                    <span
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-slate-900"
                      style={{ backgroundColor: cfg.color }}
                    />
                  </div>

                  {/* Station Name */}
                  <span className="text-[12px] font-bold text-slate-200 mt-2 font-display">{s.name}</span>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded mt-1 font-semibold uppercase ${cfg.badge}`}
                  >
                    {cfg.text}
                  </span>

                  {/* Train Location Tag */}
                  <span className="text-[9.5px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                    🚄 {s.train.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Corridor Metric Strip */}
      <div className="mt-4 pt-3 border-t border-[#26364D] grid grid-cols-2 md:grid-cols-4 gap-3 text-[11.5px] font-mono">
        <div className="bg-[#050B16]/80 p-2.5 rounded border border-[#26364D]">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Corridor Length</span>
          <span className="text-white font-bold text-[13px]">795 Route KM</span>
        </div>
        <div className="bg-[#050B16]/80 p-2.5 rounded border border-[#26364D]">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Possessions</span>
          <span className="text-[#06B6D4] font-bold text-[13px]">3 Block Windows</span>
        </div>
        <div className="bg-[#050B16]/80 p-2.5 rounded border border-[#26364D]">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Section Conflicts</span>
          <span className="text-red-400 font-bold text-[13px]">1 Conflict (AGC–GWL)</span>
        </div>
        <div className="bg-[#050B16]/80 p-2.5 rounded border border-[#26364D]">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Signalling System</span>
          <span className="text-emerald-400 font-bold text-[13px]">KAVACH AUTOMATIC</span>
        </div>
      </div>
    </div>
  );
}
