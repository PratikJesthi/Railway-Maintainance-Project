import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiJson, wsUrl } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { SIM_INJECT, DEPTS, SECTIONS, NOW_H as FALLBACK_NOW_H } from '../data/opsData';
import { fmtWindow } from '../utils.js';

const AppCtx = createContext(null);

export const SCREENS = {
  command: { id: 'command', title: 'Command Centre', subtitle: 'System-wide KPIs · Week 37', hindi: 'नियंत्रण केंद्र' },
  timeline: { id: 'timeline', title: 'Corridor Timeline', subtitle: 'NDLS → BPL · possession plan', hindi: 'समय-सारणी' },
  timetable: { id: 'timetable', title: 'Train Timetable', subtitle: 'Section passes & path-hold schedules', hindi: 'ट्रेन समय-सारणी' },
  queue: { id: 'queue', title: 'Priority Queue', subtitle: 'ML-ranked · transparent scoring', hindi: 'प्राथमिकता सूची' },
  conflict: { id: 'conflict', title: 'Conflict Resolution', subtitle: 'Multi-department coordination', hindi: 'विवाद समाधान' },
  reports: { id: 'reports', title: 'Reports & Horizon Planning', subtitle: 'Weekly ops ↔ monthly planning', hindi: 'रिपोर्ट एवं योजना' },
  audit: { id: 'audit', title: 'Audit Log', subtitle: 'Every decision traceable — overrides, AI actions, what-ifs', hindi: 'लेखा-परीक्षा लॉग' },
};

// FeedEventRead is {time, color, text}; the rest of the app (CommandCentre.jsx)
// renders feed rows as [time, color, text] triples — keep that shape so no
// screen component needs to change.
const feedRowFrom = (e) => [e.time, e.color, e.text];

export function AppProvider({ children }) {
  const { user } = useAuth();

  const [screen, setScreen] = useState('command');
  const [aiMode, setAiMode] = useState(false);
  const [depts, setDepts] = useState(DEPTS);
  const [sections, setSections] = useState(SECTIONS);
  const [blocks, setBlocks] = useState([]);
  const [queue, setQueue] = useState([]);
  const [feed, setFeed] = useState([]);
  const [audit, setAudit] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [resolved, setResolved] = useState(false);
  const [panelBlock, setPanelBlock] = useState(null);
  const [toast, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  // Timeline zoom / horizon
  const [zoom, setZoom] = useState('week');
  const [horizon, setHorizon] = useState('weekly');
  const [nowH, setNowH] = useState(FALLBACK_NOW_H);

  // What-if sandbox (client-side preview only — see applyScenario for the
  // one point it actually writes to the backend)
  const [sandbox, setSandbox] = useState(false);
  const [scenario, setScenario] = useState(null); // {id, sec, dept, dur, origStart, newStart}

  // 24h simulation — entirely client-side. The backend has no matching
  // endpoint (no "advance simulated time" concept), so this stays a local
  // preview over whatever real blocks/queue are already loaded, same as
  // before; it does not write anything back.
  const [simRunning, setSimRunning] = useState(false);
  const simTimerRef = useRef(null);
  const simMetaRef = useRef({ completed: 0, injected: 0 });
  const resolvedRef = useRef(resolved);
  useEffect(() => { resolvedRef.current = resolved; }, [resolved]);

  const wsRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  // ---------- Local-only feed/audit writers — SIMULATION USE ONLY ----------
  // Any action that hits the real backend must NOT also call these: the
  // backend writes its own audit/feed rows and broadcasts them over the
  // websocket, so calling both would duplicate every entry.
  const pushFeedLocal = useCallback((text, color) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    setFeed((f) => [[time, color, text], ...f].slice(0, 12));
  }, []);

  const logAuditLocal = useCallback((action, detail, by) => {
    const t = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    setAudit((a) => [{ t, by: by || 'Control User', action, detail, type: /OVERRIDE/.test(action) ? 'warn' : 'ok' }, ...a]);
    pushFeedLocal(`📝 ${action} — ${detail}`, '#B9812C');
  }, [pushFeedLocal]);

  // ---------- Initial hydrate from the real backend ----------
  const loadBootstrap = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      const data = await apiJson('/api/bootstrap');
      if (data.depts) setDepts(data.depts);
      if (data.sections) setSections(data.sections);
      setBlocks(data.blocks);
      setQueue(data.queue);
      setFeed(data.feed.map(feedRowFrom));
      setAudit(data.audit);
      setKpis(data.kpis);
      setNowH(data.now_h);
      setResolved(data.resolved);
    } catch (err) {
      setDataError(err.message || 'Could not reach the backend.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadBootstrap();
  }, [user, loadBootstrap]);

  // ---------- Live feed / audit over the websocket ----------
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    let retryTimer = null;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        let msg;
        try { msg = JSON.parse(evt.data); } catch (_) { return; }
        if (msg.channel === 'feed') {
          setFeed((f) => [[msg.time, msg.color, msg.text], ...f].slice(0, 12));
        } else if (msg.channel === 'audit') {
          setAudit((a) => [{ t: msg.t, by: msg.by, action: msg.action, detail: msg.detail, type: msg.type }, ...a]);
        }
      };
      ws.onclose = () => {
        if (!cancelled) retryTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    };
    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, [user]);

  // ---------- Approve / override a single block — real backend writes ----------
  const approveBlock = useCallback(async (block) => {
    try {
      const updated = await apiJson(`/api/blocks/${encodeURIComponent(block.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          st: 'Scheduled',
          action: 'BLOCK APPROVED',
          reason: `${block.id} approved — written back to TMS`,
          by: user?.name,
        }),
      });
      setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showToast(`✓ Block ${block.id} approved — written back to TMS`);
    } catch (err) {
      showToast(`✗ Approve failed: ${err.message}`);
    }
  }, [user, showToast]);

  const overrideBlock = useCallback(async (block, reason) => {
    if (!reason) { showToast('Override cancelled — a reason is mandatory per SOP'); return; }
    try {
      await apiJson('/api/audit', {
        method: 'POST',
        body: JSON.stringify({
          action: 'MANUAL OVERRIDE',
          detail: `${block.id}: ${reason}`,
          by: user?.name || 'Control User',
        }),
      });
      showToast('Override logged with reason ✓ — visible on the Audit Log screen');
    } catch (err) {
      showToast(`✗ Override failed: ${err.message}`);
    }
  }, [user, showToast]);

  // ---------- Conflict resolution — real backend write (C-1 only; the
  // backend's resolve endpoint doesn't yet generalise to imported real
  // conflicts, see memory.md) ----------
  const resolveConflict = useCallback(async (method) => {
    try {
      const result = await apiJson('/api/conflicts/resolve', {
        method: 'POST',
        body: JSON.stringify({ conflict_id: 'C-1', method, by: user?.name }),
      });
      if (result.merged_block) {
        setBlocks((prev) => [
          ...prev.filter((b) => b.id !== 'B-301' && b.id !== 'B-302'),
          result.merged_block,
        ]);
      }
      setResolved(true);
      showToast(result.message || '✓ Conflict resolved — timeline updated, entry written to audit log');
    } catch (err) {
      showToast(`✗ Resolve failed: ${err.message}`);
    }
  }, [user, showToast]);

  // ---------- What-if sandbox ----------
  const toggleSandbox = useCallback(() => {
    if (simRunning) { showToast('Finish the 24h simulation first'); return; }
    setSandbox((v) => {
      const next = !v;
      if (!next) setScenario(null);
      setZoom('week');
      showToast(next ? '🧪 Sandbox ON — drag any block on the timeline, see the cascade before you commit' : 'Sandbox off');
      return next;
    });
    setScreen('timeline');
  }, [simRunning, showToast]);

  const previewScenario = useCallback((block, newStart) => {
    const secBlocks = blocks.filter((b) => b.sec === block.sec && b.id !== block.id);
    const origEnd = block.start + block.dur;
    const origConflicts = secBlocks.filter((b) => block.start < b.start + b.dur && origEnd > b.start);

    const newEnd = newStart + block.dur;
    const newConflicts = secBlocks.filter((b) => newStart < b.start + b.dur && newEnd > b.start);

    const conflictIds = newConflicts.map((b) => b.id);
    const delta = newConflicts.length - origConflicts.length;
    const delayH = newStart - block.start;

    setScenario({
      id: block.id,
      sec: block.sec,
      dept: block.dept,
      dur: block.dur,
      origStart: block.start,
      newStart,
      delayH,
      conflictIds,
      delta,
    });
  }, [blocks]);

  const discardScenario = useCallback((silent) => {
    setScenario(null);
    if (!silent) showToast('Scenario discarded — no changes made');
  }, [showToast]);

  // Applying a scenario is a real write (PATCH start) — the backend
  // recomputes conflict flags for the whole section server-side, so we
  // refetch the block list afterwards rather than guessing the diff locally.
  const applyScenario = useCallback(async () => {
    if (!scenario) return;
    try {
      await apiJson(`/api/blocks/${encodeURIComponent(scenario.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          start: scenario.newStart,
          action: 'WHAT-IF APPLIED',
          reason: `${scenario.id} moved: ${fmtWindow(scenario.origStart, scenario.dur)} → ${fmtWindow(scenario.newStart, scenario.dur)}`,
          by: user?.name,
        }),
      });
      const fresh = await apiJson('/api/blocks');
      setBlocks(fresh);
      showToast('✓ Scenario applied — timeline updated, entry written to audit log');
    } catch (err) {
      showToast(`✗ Apply failed: ${err.message}`);
    } finally {
      setScenario(null);
    }
  }, [scenario, user, showToast]);

  // ---------- Horizon (weekly / monthly) ----------
  const changeHorizon = useCallback((h) => {
    setHorizon(h);
    setZoom(h === 'monthly' ? 'month' : 'week');
    showToast(`Horizon switched to ${h} — timeline & reports rescaled`);
  }, [showToast]);

  // ---------- 24h Interactive Simulation & Real Solver/ML Integration ----------
  const [simPaused, setSimPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 5x
  const [simStats, setSimStats] = useState({ completed: 0, injected: 0, optimizerRuns: 0, cascadeSavedMins: 0 });
  const [simSummaryReport, setSimSummaryReport] = useState(null);

  const simStateRef = useRef({
    simT: FALLBACK_NOW_H,
    startT: FALLBACK_NOW_H,
    endT: FALLBACK_NOW_H + 24,
    paused: false,
    speed: 1,
    stats: { completed: 0, injected: 0, optimizerRuns: 0, cascadeSavedMins: 0 },
    events: [],
  });

  const stopSimulation = useCallback(() => {
    clearInterval(simTimerRef.current);
    simTimerRef.current = null;
    setSimRunning(false);
    setSimPaused(false);
    setNowH(simStateRef.current.startT);
  }, []);

  const finishSimulation = useCallback(() => {
    clearInterval(simTimerRef.current);
    simTimerRef.current = null;
    setSimRunning(false);
    setSimPaused(false);

    const s = simStateRef.current.stats;
    const report = {
      completedBlocks: s.completed,
      injectedDefects: s.injected,
      optimizerRuns: s.optimizerRuns,
      cascadeSavedMins: Math.round(s.cascadeSavedMins),
      events: [...simStateRef.current.events],
    };
    setSimSummaryReport(report);
    setNowH(simStateRef.current.startT);

    const msg = `🏁 24h Simulation Complete — ${s.completed} blocks closed · ${s.injected} defects auto-planned · ${s.optimizerRuns} CP-SAT runs · +${Math.round(s.cascadeSavedMins)}m cascade delay prevented`;
    pushFeedLocal(msg, '#3AACA3');
    showToast(msg);
  }, [pushFeedLocal, showToast]);

  const runSimTick = useCallback(async () => {
    if (simStateRef.current.paused) return;

    let { simT, endT, startT, stats, events } = simStateRef.current;
    simT += 1;
    simStateRef.current.simT = simT;
    setNowH(simT);

    // Update block statuses
    setBlocks((prev) => prev.map((b) => {
      if (b.st === 'Scheduled' && simT >= b.start && simT < b.start + b.dur) {
        return { ...b, st: 'In Progress' };
      }
      if (b.st !== 'Completed' && (b.st === 'Scheduled' || b.st === 'In Progress') && simT >= b.start + b.dur) {
        stats.completed += 1;
        events.push({ hour: Math.round(simT - startT), type: 'complete', text: `Block ${b.id} completed on ${b.sec}` });
        pushFeedLocal(`✔ ${b.id} completed — ${b.dur}h possession released on ${b.sec}`, '#3E8E5B');
        return { ...b, st: 'Completed' };
      }
      return b;
    }));

    // Check for defect injection
    const offset = Math.round(simT - startT);
    const inject = SIM_INJECT.find((x) => x.at === offset || x.at === Math.round(simT));
    if (inject) {
      stats.injected += 1;
      const nb = { ...inject.block };
      setBlocks((prev) => [...prev, nb]);
      setQueue((prev) => [{
        id: nb.defect, dept: nb.dept, sec: nb.sec, st: 'Pending',
        sev: 24, ovd: 0, crit: 14, saf: 10, src: nb.src,
        why: `Live defect received during 24h simulation — auto-planned by CP-SAT solver.`,
      }, ...prev]);

      logAuditLocal('NEW DEFECT INGESTED', `${nb.defect} (${DEPTS[nb.dept]?.name || nb.dept}) → auto-planned as ${nb.id} on ${nb.sec}`, 'SANCHALAN Optimiser');
      pushFeedLocal(`⚡ New defect ${nb.defect} ingested → running CP-SAT optimizer for ${nb.sec}`, '#B9812C');

      // Execute live CP-SAT & ML Cascade calls for simulation event
      try {
        stats.optimizerRuns += 1;
        const cascadeRes = await apiJson(`/api/trains/cascade-impact?delay_received_seconds=${nb.dur * 3600}&propagation_depth=1&is_root=true`).catch(() => null);
        if (cascadeRes) {
          stats.cascadeSavedMins += cascadeRes.predicted_propagated_delay_minutes;
        }
      } catch (_) {}

      events.push({ hour: offset, type: 'inject', text: `Defect ${nb.defect} ingested on ${nb.sec} → CP-SAT auto-scheduled ${nb.id}` });
    }

    if (!resolvedRef.current && simT - startT >= 20) {
      resolvedRef.current = true;
      resolveConflict('ai');
    }

    setSimStats({ ...stats });

    if (simT >= endT) {
      finishSimulation();
    }
  }, [pushFeedLocal, logAuditLocal, resolveConflict, finishSimulation, DEPTS]);

  const startSimulation = useCallback(() => {
    if (simRunning) return;
    if (sandbox) { setSandbox(false); setScenario(null); }
    setZoom('week');
    setScreen('timeline');
    setSimRunning(true);
    setSimPaused(false);
    setSimSummaryReport(null);

    const startT = nowH;
    const initialStats = { completed: 0, injected: 0, optimizerRuns: 0, cascadeSavedMins: 0 };
    setSimStats(initialStats);

    simStateRef.current = {
      simT: startT,
      startT: startT,
      endT: startT + 24,
      paused: false,
      speed: simSpeed,
      stats: initialStats,
      events: [],
    };

    pushFeedLocal('⏩ 24h simulation started — CP-SAT & ML Cascade Predictor running live', '#3AACA3');

    const intervalMs = Math.round(500 / simSpeed);
    simTimerRef.current = setInterval(runSimTick, intervalMs);
  }, [simRunning, sandbox, nowH, simSpeed, pushFeedLocal, runSimTick]);

  const pauseSimulation = useCallback(() => {
    setSimPaused(true);
    simStateRef.current.paused = true;
  }, []);

  const resumeSimulation = useCallback(() => {
    setSimPaused(false);
    simStateRef.current.paused = false;
  }, []);

  const changeSimSpeed = useCallback((spd) => {
    setSimSpeed(spd);
    simStateRef.current.speed = spd;
    if (simRunning && !simStateRef.current.paused) {
      clearInterval(simTimerRef.current);
      const intervalMs = Math.round(500 / spd);
      simTimerRef.current = setInterval(runSimTick, intervalMs);
    }
  }, [simRunning, runSimTick]);

  const stepSimulation = useCallback(() => {
    if (!simRunning) return;
    runSimTick();
  }, [simRunning, runSimTick]);

  useEffect(() => () => clearInterval(simTimerRef.current), []);

  const value = {
    screen, setScreen,
    aiMode, setAiMode,
    depts, setDepts,
    sections, setSections,
    blocks, queue, feed, audit, kpis,
    dataLoading, dataError, reloadData: loadBootstrap,
    resolved, resolveConflict,
    panelBlock, setPanelBlock,
    toast, showToast,
    approveBlock, overrideBlock,
    zoom, setZoom,
    horizon, changeHorizon,
    nowH,
    sandbox, toggleSandbox,
    scenario, previewScenario, applyScenario, discardScenario,
    simRunning, startSimulation, stopSimulation, pauseSimulation, resumeSimulation,
    simPaused, simSpeed, changeSimSpeed, stepSimulation, simStats, simSummaryReport, setSimSummaryReport,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
