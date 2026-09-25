import React from 'react';
import { useApp } from './context/AppContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/screens/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Toast from './components/Toast.jsx';
import SidePanel from './components/SidePanel.jsx';
import ScenarioBar from './components/ScenarioBar.jsx';
import Overview from './components/screens/Overview.jsx';
import CommandCentre from './components/screens/CommandCentre.jsx';
import CorridorTimeline from './components/screens/CorridorTimeline.jsx';
import TrainTimetable from './components/screens/TrainTimetable.jsx';
import PriorityQueue from './components/screens/PriorityQueue.jsx';
import ConflictResolution from './components/screens/ConflictResolution.jsx';
import AssetStock from './components/screens/AssetStock.jsx';
import Reports from './components/screens/Reports.jsx';
import AuditLog from './components/screens/AuditLog.jsx';

const SCREEN_COMPONENTS = {
  overview: Overview,
  command: CommandCentre,
  timeline: CorridorTimeline,
  timetable: TrainTimetable,
  queue: PriorityQueue,
  conflict: ConflictResolution,
  assets: AssetStock,
  reports: Reports,
  audit: AuditLog,
};

export default function App() {
  const { screen, dataLoading, dataError, reloadData } = useApp();
  const { user, loading } = useAuth();
  const ScreenComponent = SCREEN_COMPONENTS[screen] || CommandCentre;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B16] flex items-center justify-center text-[13px] font-mono text-[#06B6D4]">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-[#050B16] flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="text-[14px] text-white font-mono font-bold">Couldn't load corridor data from the backend</div>
        <div className="text-[12px] text-slate-400 max-w-sm font-mono">{dataError}</div>
        <button
          onClick={reloadData}
          className="text-[12px] font-mono font-bold text-white px-4 py-2 rounded bg-[#06B6D4] hover:bg-[#06B6D4]/80 shadow-sm"
        >
          RETRY CONNECTION
        </button>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#050B16] flex items-center justify-center text-[13px] font-mono text-[#06B6D4]">
        Loading Central Railway Corridor Data…
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden text-slate-100 bg-[#050B16]">
      {/* 1. GLOBAL RAILWAY BACKGROUND LAYER */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-fixed pointer-events-none transition-all duration-700"
        style={{ backgroundImage: 'url(/images/ir_global_bg.jpg)' }}
      >
        {/* Moderate translucent overlay allowing railway corridor environment to shine through */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050B16]/82 via-[#0B1424]/75 to-[#050B16]/85 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 flex w-full h-full">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-transparent">
          <Topbar />
          <div className="flex-1 overflow-y-auto p-5 space-y-0">
            <ScreenComponent />
          </div>
        </main>
        <SidePanel />
        <ScenarioBar />
        <Toast />
      </div>
    </div>
  );

}
