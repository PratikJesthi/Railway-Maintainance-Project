import React from 'react';
import { useApp } from './context/AppContext.jsx';
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
  const { screen } = useApp();
  const ScreenComponent = SCREEN_COMPONENTS[screen];

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
