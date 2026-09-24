import React from 'react';
import { useApp } from './context/AppContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/screens/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Toast from './components/Toast.jsx';
import SidePanel from './components/SidePanel.jsx';
import ScenarioBar from './components/ScenarioBar.jsx';
import CommandCentre from './components/screens/CommandCentre.jsx';
import CorridorTimeline from './components/screens/CorridorTimeline.jsx';
import PriorityQueue from './components/screens/PriorityQueue.jsx';
import ConflictResolution from './components/screens/ConflictResolution.jsx';
import Reports from './components/screens/Reports.jsx';
import AuditLog from './components/screens/AuditLog.jsx';

const SCREEN_COMPONENTS = {
  command: CommandCentre,
  timeline: CorridorTimeline,
  queue: PriorityQueue,
  conflict: ConflictResolution,
  reports: Reports,
  audit: AuditLog,
};

export default function App() {
  const { screen, dataLoading, dataError, reloadData } = useApp();
  const { user, loading } = useAuth();
  const ScreenComponent = SCREEN_COMPONENTS[screen];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[12px] text-ink-500">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (dataError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="text-[13px] text-ink-900 font-medium">Couldn't load data from the backend</div>
        <div className="text-[11.5px] text-ink-500 max-w-sm">{dataError}</div>
        <button
          onClick={reloadData}
          className="text-[11.5px] font-medium text-white px-3.5 py-2 rounded-md"
          style={{ background: '#0F7A73' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[12px] text-ink-500">
        Loading corridor data…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 overflow-y-auto p-5">
          <ScreenComponent />
        </div>
      </main>
      <SidePanel />
      <ScenarioBar />
      <Toast />
    </div>
  );
}
