import React, { useState } from 'react';

const STATIONS = [
  { code: 'NDLS', name: 'New Delhi', km: '0', status: 'GREEN', stateLabel: 'Clear Operations', activeBlock: 'None', trainCount: 14, dept: 'ENG', note: 'All block sections green. KAVACH automatic protection active.' },
  { code: 'MTJ', name: 'Mathura Jn', km: '141', status: 'TEAL', stateLabel: 'Planned Possession', activeBlock: 'BLK-MTJ-02', trainCount: 9, dept: 'ENG', note: 'Scheduled P.Way rail grinding & ballast tamping from 14:00 IST.' },
  { code: 'AGC', name: 'Agra Cantt', km: '195', status: 'RED', stateLabel: 'Conflict Warning', activeBlock: 'B-301 / B-302', trainCount: 11, dept: 'TRAC/ENG', note: 'CRITICAL OVERLAP: TRAC OHE isolation overlaps P.Way track relay.' },
  { code: 'GWL', name: 'Gwalior Jn', km: '313', status: 'AMBER', stateLabel: 'Active Maintenance', activeBlock: 'BLK-GWL-09', trainCount: 6, dept: 'TRAC', note: 'OHE overhead wire cantilever maintenance in progress on Line 2.' },
  { code: 'JHS', name: 'VGL Jhansi', km: '410', status: 'VIOLET', stateLabel: 'S&T Activity', activeBlock: 'BLK-JHS-14', trainCount: 8, dept: 'SNT', note: 'Solid State Interlocking (SSI) software upgrade & axle counter test.' },
  { code: 'BPL', name: 'Bhopal Jn', km: '701', status: 'GREEN', stateLabel: 'Clear Operations', activeBlock: 'None', trainCount: 12, dept: 'ENG', note: 'Yard movements smooth. 3 freight rakes dispatched.' },
  { code: 'ET', name: 'Itarsi Jn', km: '793', status: 'GREEN', stateLabel: 'Clear Operations', activeBlock: 'None', trainCount: 15, dept: 'ENG', note: 'Electrified corridor fully operational. Junction yard clear.' },
];

const SECTIONS = [
  { id: 'SEC-NDLS-MTJ', from: 'NDLS', to: 'MTJ', name: 'NDLS–MTJ Section', status: 'GREEN', color: '#10B981', load: '65%', trains: '12626 Kerala Exp, 12002 Shatabdi', window: 'Clear window' },
  { id: 'SEC-MTJ-AGC', from: 'MTJ', to: 'AGC', name: 'MTJ–AGC Section', status: 'TEAL', color: '#06B6D4', load: '50%', trains: '22692 Rajdhani, 12722 Dakshin Exp', window: 'Planned 14:00–17:00' },
  { id: 'SEC-AGC-GWL', from: 'AGC', to: 'GWL', name: 'AGC–GWL Section', status: 'RED', color: '#EF4444', load: '88%', trains: '12191 Shridham Exp, 12616 G T Exp', window: 'CONFLICT: 11:30–15:30' },
  { id: 'SEC-GWL-JHS', from: 'GWL', to: 'JHS', name: 'GWL–JHS Section', status: 'AMBER', color: '#F59E0B', load: '72%', trains: '12708 Sampark Kranti', window: 'Active 09:00–13:00' },
  { id: 'SEC-JHS-BPL', from: 'JHS', to: 'BPL', name: 'JHS–BPL Section', status: 'VIOLET', color: '#8B5CF6', load: '58%', trains: '12001 Vande Bharat, 12622 Tamil Nadu Exp', window: 'S&T Window 10:00–12:30' },
  { id: 'SEC-BPL-ET', from: 'BPL', to: 'ET', name: 'BPL–ET Section', status: 'GREEN', color: '#10B981', load: '60%', trains: '12156 Shaan-E-Bhopal', window: 'Clear window' },
];

const STATUS_COLORS = {
  GREEN: { bg: '#10B981', border: '#059669', text: 'text-emerald-400', label: 'ACTIVE / AVAILABLE' },
  TEAL: { bg: '#06B6D4', border: '#0891B2', text: 'text-cyan-400', label: 'PLANNED POSSESSION' },
  AMBER: { bg: '#F59E0B', border: '#D97706', text: 'text-amber-400', label: 'MAINTENANCE POSSESSION' },
  RED: { bg: '#EF4444', border: '#DC2626', text: 'text-red-400', label: 'CONFLICT WARNING' },
  VIOLET: { bg: '#8B5CF6', border: '#7C3AED', text: 'text-violet-400', label: 'S&T ACTIVITY' },
};

export default function NetworkMapComponent() {
  const [selectedItem, setSelectedItem] = useState(STATIONS[2]); // Default to AGC conflict node

  return (
    <div className="bg-[#101B2D] border border-[#26364D] rounded-md p-5 shadow-lg relative overflow-hidden">
      {/* Background Topographic / Railway Track Satellite Texture Layer */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'url(/images/ir_tracks_signal.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Map Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-[#26364D] mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
            <h3 className="text-[16px] font-bold text-white font-display">
              CENTRAL RAILWAY NETWORK MAP · CENTRAL CORRIDOR
            </h3>
          </div>
          <p className="text-[11.5px] text-slate-400 font-mono">
            Interactive block status map: NDLS → MTJ → AGC → GWL → JHS → BPL → ET (793 KM)
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono font-bold bg-[#050B16] px-3 py-1.5 rounded border border-[#26364D]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> GREEN: Active
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500" /> TEAL: Planned
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> AMBER: Maintenance
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" /> RED: Conflict
          </span>
          <span className="flex items-center gap-1 text-violet-400">
            <span className="w-2 h-2 rounded-full bg-violet-500" /> VIOLET: S&amp;T
          </span>
        </div>
      </div>

      {/* Railway Track Schematic Visualization */}
      <div className="relative z-10 bg-[#0B1424] border border-[#26364D] rounded p-6 mb-5 overflow-x-auto">
        <div className="min-w-[800px] relative py-8 px-4">
          {/* Main Track Line Graphic (Parallel Double Rails) */}
          <div className="absolute top-[48%] left-10 right-10 h-3 transform -translate-y-1/2 flex flex-col justify-between opacity-60">
            <div className="h-[2px] bg-slate-600 w-full" />
            <div className="h-[2px] bg-slate-600 w-full" />
          </div>

          {/* Section Line Highlights */}
          <div className="absolute top-[48%] left-10 right-10 h-1 transform -translate-y-1/2 flex">
            {SECTIONS.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => setSelectedItem(sec)}
                className="flex-1 h-1.5 relative group transition-all"
                style={{ background: sec.color }}
                title={`Click section ${sec.name}`}
              >
                {/* Section pulse bar on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  style={{ background: sec.color, boxShadow: `0 0 10px ${sec.color}` }}
                />
              </button>
            ))}
          </div>

          {/* Station Nodes */}
          <div className="relative flex justify-between items-center z-10">
            {STATIONS.map((stn) => {
              const cfg = STATUS_COLORS[stn.status];
              const isSelected = selectedItem?.code === stn.code;
              return (
                <button
                  key={stn.code}
                  onClick={() => setSelectedItem(stn)}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  {/* Station Code Badge */}
                  <span className="text-[10px] font-mono font-bold text-slate-300 mb-2 group-hover:text-white transition-colors">
                    {stn.name}
                  </span>

                  {/* Signal Node Dot */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isSelected ? 'ring-4 ring-cyan-400 scale-110 shadow-lg' : 'hover:scale-105'
                    }`}
                    style={{
                      background: cfg.bg,
                      boxShadow: `0 0 12px ${cfg.bg}80`,
                      border: `2px solid ${cfg.border}`,
                    }}
                  >
                    <span className="text-[9px] font-mono font-bold text-slate-950">{stn.code}</span>
                  </div>

                  {/* Km Mark */}
                  <span className="text-[9px] font-mono text-slate-400 mt-2">
                    {stn.km} KM
                  </span>

                  {/* State badge below */}
                  <span
                    className="text-[8.5px] font-mono px-1.5 py-0.5 rounded mt-1 font-semibold uppercase tracking-wider"
                    style={{ background: `${cfg.bg}20`, color: cfg.bg, border: `1px solid ${cfg.bg}40` }}
                  >
                    {stn.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Station / Section Detailed Control Drawer Panel */}
      {selectedItem && (
        <div className="relative z-10 bg-[#050B16] border border-[#26364D] rounded p-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#26364D] pb-2.5 mb-3">
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  background: STATUS_COLORS[selectedItem.status]?.bg || selectedItem.color,
                  boxShadow: `0 0 8px ${STATUS_COLORS[selectedItem.status]?.bg || selectedItem.color}`,
                }}
              />
              <span className="text-[14px] font-bold text-white">
                {selectedItem.code ? `STATION CONSOLE: ${selectedItem.name} (${selectedItem.code})` : selectedItem.name}
              </span>
              <span
                className="text-[10px] px-2.5 py-0.5 rounded font-bold uppercase"
                style={{
                  background: `${STATUS_COLORS[selectedItem.status]?.bg || selectedItem.color}25`,
                  color: STATUS_COLORS[selectedItem.status]?.bg || selectedItem.color,
                  border: `1px solid ${STATUS_COLORS[selectedItem.status]?.bg || selectedItem.color}50`,
                }}
              >
                {selectedItem.stateLabel || selectedItem.status}
              </span>
            </div>

            <span className="text-[11px] text-slate-400">
              NDLS → BPL Corridor Section
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[12px]">
            <div className="bg-[#101B2D] p-3 rounded border border-[#26364D]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Active Block ID</span>
              <span className="text-white font-bold text-[13px]">{selectedItem.activeBlock || selectedItem.window || 'None'}</span>
            </div>

            <div className="bg-[#101B2D] p-3 rounded border border-[#26364D]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Active Department</span>
              <span className="text-[#06B6D4] font-bold text-[13px]">{selectedItem.dept || 'Engineering (P.Way)'}</span>
            </div>

            <div className="bg-[#101B2D] p-3 rounded border border-[#26364D]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Train Movement Traffic</span>
              <span className="text-amber-400 font-bold text-[13px]">{selectedItem.trainCount ? `${selectedItem.trainCount} trains active` : selectedItem.trains}</span>
            </div>

            <div className="bg-[#101B2D] p-3 rounded border border-[#26364D]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Operational Status</span>
              <span className="text-emerald-400 font-bold text-[13px]">{selectedItem.stateLabel || selectedItem.status}</span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-[#142238] border border-[#26364D] rounded text-[11.5px] text-slate-200 leading-relaxed">
            <span className="font-bold text-[#06B6D4]">OPERATIONAL SOP NOTE: </span>
            {selectedItem.note || `Corridor section ${selectedItem.name} operating under Central Railway block regulations. Active trains: ${selectedItem.trains}`}
          </div>
        </div>
      )}
    </div>
  );
}
