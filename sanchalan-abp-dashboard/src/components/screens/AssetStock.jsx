import React, { useState } from 'react';
import Card from '../ui/Card.jsx';

const ASSETS = [
  { id: 'AST-OHE-01', name: '8-Wheeler OHE Tower Wagon', dept: 'Traction', location: 'Agra Cantt (AGC) Depot', status: 'Ready', health: '98%', lastMaint: '22 Sep 2026', operator: 'Rajesh Kumar (TRAC)' },
  { id: 'AST-OHE-02', name: '4-Wheeler Inspection Car', dept: 'Traction', location: 'Gwalior (GWL) Shed', status: 'In Use', health: '92%', lastMaint: '18 Sep 2026', operator: 'Sanjay V. (TRAC)' },
  { id: 'AST-ENG-01', name: 'CSM 09-32 Track Tamping Machine', dept: 'Engineering', location: 'Mathura (MTJ) Yard', status: 'Ready', health: '95%', lastMaint: '20 Sep 2026', operator: 'A. K. Sharma (ENG)' },
  { id: 'AST-ENG-02', name: 'Unimat 08-275 Point Tamping Express', dept: 'Engineering', location: 'Jhansi (JHS) Yard', status: 'In Use', health: '90%', lastMaint: '15 Sep 2026', operator: 'Pravin Singh (ENG)' },
  { id: 'AST-ENG-03', name: 'Rail Grinding Train (RGT-20)', dept: 'Engineering', location: 'Bhopal (BPL) Depot', status: 'Maintenance', health: '78%', lastMaint: '10 Sep 2026', operator: 'R. K. Meena (ENG)' },
  { id: 'AST-SNT-01', name: 'Digital Axle Counter Test Rig', dept: 'S&T', location: 'Agra Cantt (AGC) Lab', status: 'Ready', health: '99%', lastMaint: '24 Sep 2026', operator: 'D. N. Gupta (SNT)' },
  { id: 'AST-SNT-02', name: 'Electronic Interlocking Emergency Van', dept: 'S&T', location: 'Jhansi (JHS) S&T Depot', status: 'Ready', health: '97%', lastMaint: '21 Sep 2026', operator: 'V. K. Rao (SNT)' },
];

export default function AssetStock() {
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredAssets = ASSETS.filter((a) => {
    if (filterDept && a.dept !== filterDept) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="screen-enter space-y-4 font-mono">
      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#101B2D] p-5 rounded-md border border-[#26364D]">
        <div>
          <h2 className="text-base font-bold text-white font-display">RAILWAY MACHINERY &amp; ASSET INVENTORY</h2>
          <p className="text-[12px] text-slate-400 font-sans mt-0.5">
            Tracking specialized machines, OHE tower cars, track tampers, and S&amp;T testing rigs across Central Railway.
          </p>
        </div>

        <div className="flex gap-3 font-mono">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-[#050B16] border border-[#26364D] text-[#06B6D4] text-[12px] px-3 py-1.5 rounded font-bold outline-none"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering (P.Way)</option>
            <option value="Traction">Traction (OHE)</option>
            <option value="S&T">Signal &amp; Telecom (S&amp;T)</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#050B16] border border-[#26364D] text-[#06B6D4] text-[12px] px-3 py-1.5 rounded font-bold outline-none"
          >
            <option value="">All Availability</option>
            <option value="Ready">Ready for Possession</option>
            <option value="In Use">Active on Possession</option>
            <option value="Maintenance">In Depot Maintenance</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <Card className="bg-[#101B2D] overflow-hidden">
        <div className="grid text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 px-5 py-3 border-b border-[#26364D] bg-[#050B16]">
          <div className="grid grid-cols-12 gap-3">
            <span className="col-span-2">Asset ID</span>
            <span className="col-span-3">Machine Name</span>
            <span className="col-span-2">Department</span>
            <span className="col-span-2">Home Depot</span>
            <span className="col-span-1">Health</span>
            <span className="col-span-2 text-right">Status</span>
          </div>
        </div>

        <div className="divide-y divide-[#26364D]/60 font-mono">
          {filteredAssets.map((asset) => (
            <div key={asset.id} className="px-5 py-3 text-[12.5px] hover:bg-[#0B1424] transition-colors">
              <div className="grid grid-cols-12 gap-3 items-center">
                <span className="col-span-2 num font-bold text-[#06B6D4]">{asset.id}</span>
                <span className="col-span-3 font-semibold text-slate-100 font-sans">{asset.name}</span>
                <span className="col-span-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full" style={{
                    background: asset.dept === 'Traction' ? '#F59E0B20' : asset.dept === 'Engineering' ? '#06B6D420' : '#8B5CF620',
                    color: asset.dept === 'Traction' ? '#F59E0B' : asset.dept === 'Engineering' ? '#06B6D4' : '#8B5CF6',
                    border: `1px solid ${asset.dept === 'Traction' ? '#F59E0B40' : asset.dept === 'Engineering' ? '#06B6D440' : '#8B5CF640'}`,
                  }}>
                    {asset.dept}
                  </span>
                </span>
                <span className="col-span-2 text-slate-300 font-mono text-[12px]">{asset.location}</span>
                <span className="col-span-1 num font-bold text-emerald-400">{asset.health}</span>
                <span className="col-span-2 text-right">
                  <span className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    asset.status === 'Ready' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50' :
                    asset.status === 'In Use' ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50' :
                    'bg-red-950/60 text-red-300 border border-red-700/50'
                  }`}>
                    {asset.status}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

