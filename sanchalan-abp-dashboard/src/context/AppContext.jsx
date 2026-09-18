import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { fmtWindow } from '../utils.js';
import {
  DEPTS as MOCK_DEPTS,
  SECTIONS as MOCK_SECTIONS,
  INITIAL_BLOCKS,
  INITIAL_QUEUE,
  INITIAL_FEED,
  INITIAL_AUDIT,
  KPIS as MOCK_KPIS,
  NOW_H,
} from '../data/opsData';

const AppCtx = createContext(null);

export const SCREENS = {
  command: { id: 'command', title: 'Command Centre', subtitle: 'System-wide KPIs · Week 37', hindi: 'नियंत्रण केंद्र' },
  timeline: { id: 'timeline', title: 'Corridor Timeline', subtitle: 'NDLS → BPL · possession plan', hindi: 'समय-सारणी' },
  queue: { id: 'queue', title: 'Priority Queue', subtitle: 'ML-ranked · transparent scoring', hindi: 'प्राथमिकता सूची' },
  conflict: { id: 'conflict', title: 'Conflict Resolution', subtitle: 'Multi-department coordination', hindi: 'विवाद समाधान' },
  reports: { id: 'reports', title: 'Reports & Horizon Planning', subtitle: 'Weekly ops ↔ monthly planning', hindi: 'रिपोर्ट एवं योजना' },
  audit: { id: 'audit', title: 'Audit Log', subtitle: 'Every decision traceable — overrides, AI actions, what-ifs', hindi: 'लेखा-परीक्षा लॉग' },
};

// Fallback KPI shape (man_display/ai_display) so the mock data matches what
// /api/kpis returns, in case the backend is unreachable on first load.
const MOCK_KPIS_SHAPED = MOCK_KPIS.map((k) => ({
  label: k.label,
  man: k.man,
  ai: k.ai,
  man_display: k.fmt(k.man),
  ai_display: k.fmt(k.ai),
  delta: k.delta,
  good: k.good,
}));

// Simulated live-defect injects for the 24h simulator — same three as the
// original vanilla dashboard's SIM_INJECT, fired at hour 14 / 19 / 25 of
// the sim window.
const SIM_INJECT = [
  { at: 14, b: { id: 'B-112', sec: 'NDLS–MTJ', dept: 'ENG', start: 14, dur: 8, defect: 'ENG-1401', sev: 'High', overdue: 0, src: 'SMMS', st: 'Pending', note: 'Live defect injected during simulation — auto-planned by optimiser.', conflict: false } },
  { at: 19, b: { id: 'B-113', sec: 'MTJ–AGC', dept: 'SNT', start: 19, dur: 10, defect: 'SNT-1105', sev: 'Critical', overdue: 0, src: 'TDMS', st: 'Pending', note: 'Live defect injected during simulation — auto-planned by optimiser.', conflict: false } },
  { at: 25, b: { id: 'B-114', sec: 'GWL–JHS', dept: 'TRAC', start: 25, dur: 9, defect: 'TRAC-2607', sev: 'Medium', overdue: 0, src: 'TDMS', st: 'Pending', note: 'Live defect injected during simulation — auto-planned by optimiser.', conflict: false } },
];
const SIM_DURATION_H = 24;
const SIM_TICK_MS = 420;

const overlapsLocal = (a, b) => a.sec === b.sec && a.dept !== b.dept && a.start < b.start + b.dur && b.start < a.start + a.dur;

export function AppProvider({ children }) {
  const [screen, setScreen] = useState('command');
  const [aiMode, setAiMode] = useState(false);

  const [depts, setDepts] = useState(MOCK_DEPTS);
  const [sections, setSections] = useState(MOCK_SECTIONS);
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [feed, setFeed] = useState(INITIAL_FEED.map(([time, color, text]) => ({ time, color, text })));
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [kpis, setKpis] = useState(MOCK_KPIS_SHAPED);
  const [nowH, setNowH] = useState(NOW_H);
  const [resolved, setResolved] = useState(false);

  const [apiOnline, setApiOnline] = useState(null); // null = checking, true/false after first attempt
  const [panelBlock, setPanelBlock] = useState(null);
  const [toast, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  // ---- what-if sandbox ----
  const [sandbox, setSandbox] = useState(false);
  const [scenario, setScenario] = useState(null); // {id, sec, dept, dur, origStart, newStart, conflictIds, delta, delayH}

  // ---- 24h simulator ----
  const [simRunning, setSimRunning] = useState(false);
  const simRef = useRef({ timer: null, simT: 0, startT: 0, completed: 0, injected: 0 });

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  // ---- hydrate from the backend on mount ----
  useEffect(() => {
    let cancelled = false;
    api
      .bootstrap()
      .then((d) => {
        if (cancelled) return;
        setDepts(d.depts);
        setSections(d.sections);
        setBlocks(d.blocks);
        setQueue(d.queue);
        setFeed(d.feed);
        setAudit(d.audit);
        setKpis(d.kpis);
        setNowH(d.now_h);
        setResolved(d.resolved);
        setApiOnline(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('SANCHALAN API unreachable, using local mock data.', err);
        setApiOnline(false);
        showToast('⚠ Backend offline — showing local mock data');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- live push over WebSocket (only once the API is confirmed online) ----
  useEffect(() => {
    if (apiOnline !== true) return undefined;
    let ws;
    try {
      ws = new WebSocket(api.feedSocketUrl());
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.channel === 'feed') {
          setFeed((f) => [{ time: msg.time, color: msg.color, text: msg.text }, ...f].slice(0, 12));
        } else if (msg.channel === 'audit') {
          setAudit((a) => [{ t: msg.t, by: msg.by, action: msg.action, detail: msg.detail, type: msg.type }, ...a]);
        }
      };
    } catch (err) {
      console.warn('WebSocket connection failed', err);
    }
    return () => ws && ws.close();
  }, [apiOnline]);

  // ---- writers: call the API when online, fall back to local state edits otherwise ----

  const pushFeed = useCallback(
    (text, color) => {
      if (apiOnline) {
        api.pushFeed(text, color).catch((err) => console.error('pushFeed failed', err));
        // the WebSocket delivers the row back into `feed`; no local update needed.
        return;
      }
      const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      setFeed((f) => [{ time, color, text }, ...f].slice(0, 12));
    },
    [apiOnline]
  );

  const logAudit = useCallback(
    (action, detail, by) => {
      if (apiOnline) {
        api
          .logAudit(action, detail, by)
          .then((entry) => setAudit((a) => [entry, ...a]))
          .catch((err) => console.error('logAudit failed', err));
        // the backend mirrors this into the feed too, delivered over the socket.
        return;
      }
      const t = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      setAudit((a) => [{ t, by: by || 'Control User', action, detail, type: /OVERRIDE/.test(action) ? 'warn' : 'ok' }, ...a]);
      pushFeed(`📝 ${action} — ${detail}`, '#B9812C');
    },
    [apiOnline, pushFeed]
  );

  // Local-only writers, used exclusively by the 24h simulator so a demo run
  // never spams the real backend / DB with fake data.
  const pushFeedLocal = useCallback((text, color) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    setFeed((f) => [{ time, color, text }, ...f].slice(0, 12));
  }, []);

  const logAuditLocal = useCallback(
    (action, detail, by) => {
      const t = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      setAudit((a) => [{ t, by: by || 'Control User', action, detail, type: /OVERRIDE/.test(action) ? 'warn' : 'ok' }, ...a]);
      pushFeedLocal(`📝 ${action} — ${detail}`, '#B9812C');
    },
    [pushFeedLocal]
  );

  const resolveConflict = useCallback(
    async (method) => {
      if (apiOnline) {
        try {
          const res = await api.resolveConflict('C-1', method === 'ai' ? 'ai' : method);
          setBlocks((prev) => [...prev.filter((b) => b.id !== 'B-301' && b.id !== 'B-302'), res.merged_block]);
          setAudit((a) => [res.audit_entry, ...a]);
          setFeed((f) => [res.feed_event, ...f].slice(0, 12));
          setResolved(true);
          showToast(`✓ ${res.message}`);
        } catch (err) {
          console.error('resolveConflict failed', err);
          showToast('⚠ Could not resolve conflict — backend error');
        }
        return;
      }

      setBlocks((prev) => {
        const next = prev.filter((b) => b.id !== 'B-301' && b.id !== 'B-302');
        next.push({
          id: 'B-301+302', sec: 'AGC–GWL', dept: 'Merged', start: 52, dur: 18,
          defect: 'ENG-1042 / SNT-0871', sev: 'Critical', overdue: 12, src: 'SMMS+TDMS',
          st: 'Scheduled', note: 'Combined possession — rail fracture renewal + signal failure repair, shared window.',
        });
        return next;
      });
      setResolved(true);
      if (method === 'ai') {
        logAudit('AI AUTO-RESOLVED', 'C-1 merged: B-301 + B-302 → B-301+302 on AGC–GWL, per optimiser recommendation.', 'SANCHALAN Optimiser');
        pushFeed('🤖 AI auto-resolved C-1 — merged B-301+302 without human input', '#3E8E5B');
      } else {
        logAudit('MANUAL OVERRIDE', `C-1 resolved by override: ${method}`, 'Control User');
      }
      showToast('✓ Conflict resolved — timeline updated, entry written to audit log');
    },
    [apiOnline, logAudit, pushFeed, showToast]
  );

  // ---- block actions: approve / override ----

  const approveBlock = useCallback(
    (block) => {
      logAudit('BLOCK APPROVED', `${block.id} approved — written back to TMS`, 'Control User');
      showToast(`✓ Block ${block.id} approved — written back to TMS`);
    },
    [logAudit, showToast]
  );

  const overrideBlock = useCallback(
    (block, reason) => {
      if (!reason) {
        showToast('Override cancelled — a reason is mandatory per SOP');
        return;
      }
      logAudit('MANUAL OVERRIDE', `${block.id}: ${reason}`, 'Control User');
      showToast('Override logged with reason ✓ — visible on the Audit Log screen');
    },
    [logAudit, showToast]
  );

  // ---- what-if sandbox ----

  const toggleSandbox = useCallback(() => {
    if (simRunning) {
      showToast('Finish the 24h simulation first');
      return;
    }
    const next = !sandbox;
    setSandbox(next);
    if (!next) setScenario(null);
    if (next) setScreen('timeline');
    showToast(next ? '🧪 Sandbox ON — drag any block on the timeline, see the cascade before you commit' : 'Sandbox off');
  }, [sandbox, simRunning, showToast]);

  const previewScenario = useCallback(
    (block, newStart) => {
      const others = blocks.filter((x) => x.sec === block.sec && x.id !== block.id);
      const newEnd = newStart + block.dur;
      const confs = others.filter((x) => newStart < x.start + x.dur && newEnd > x.start);
      const origConfs = others.filter((x) => block.start < x.start + x.dur && block.start + block.dur > x.start);
      const delta = confs.length - origConfs.length;
      const delayH = newStart - block.start;
      setScenario({
        id: block.id,
        sec: block.sec,
        dept: block.dept,
        dur: block.dur,
        origStart: block.start,
        newStart,
        conflictIds: confs.map((c) => c.id),
        delta,
        delayH,
      });
    },
    [blocks]
  );

  const discardScenario = useCallback(
    (silent) => {
      setScenario(null);
      if (!silent) showToast('Scenario discarded — no changes made');
    },
    [showToast]
  );

  const applyScenario = useCallback(async () => {
    if (!scenario) return;
    const { id, newStart } = scenario;
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const detail = `${id} moved: ${fmtWindow(block.start, block.dur)} → ${fmtWindow(newStart, block.dur)}`;

    if (apiOnline) {
      try {
        await api.updateBlock(id, {
          start: newStart,
          st: block.st === 'Pending' ? 'Scheduled' : undefined,
          action: 'WHAT-IF APPLIED',
          reason: detail,
          by: 'Control User',
        });
        // the PATCH may also have flipped conflict flags on OTHER blocks in
        // the section (server-side recompute) — refetch the full list
        // rather than patching just the one block we know about.
        const fresh = await api.listBlocks();
        setBlocks(fresh);
      } catch (err) {
        console.error('applyScenario failed', err);
        showToast('⚠ Could not apply scenario — backend error');
        return;
      }
    } else {
      setBlocks((prev) => {
        const moved = prev.map((b) =>
          b.id === id ? { ...b, start: newStart, st: b.st === 'Pending' ? 'Scheduled' : b.st } : b
        );
        const secBlocks = moved.filter((b) => b.sec === block.sec);
        return moved.map((b) =>
          b.sec !== block.sec ? b : { ...b, conflict: secBlocks.some((x) => x.id !== b.id && overlapsLocal(b, x)) }
        );
      });
      logAudit('WHAT-IF APPLIED', detail, 'Control User');
    }
    setScenario(null);
    showToast('✓ Scenario applied — timeline updated, entry written to audit log');
  }, [scenario, blocks, apiOnline, logAudit, showToast]);

  // ---- 24h simulator (always local-only — a visual what-if run, not persisted) ----

  const startSim = useCallback(() => {
    if (simRef.current.timer) return;
    if (sandbox) {
      setSandbox(false);
      setScenario(null);
    }
    setScreen('timeline');
    setSimRunning(true);

    const startT = nowH;
    simRef.current = { timer: null, simT: startT, startT, completed: 0, injected: 0 };
    const END = startT + SIM_DURATION_H;

    pushFeedLocal('⏩ 24h simulation started — optimiser running live', '#8FB4EC');

    simRef.current.timer = setInterval(() => {
      simRef.current.simT += 1;
      const simT = simRef.current.simT;
      setNowH(simT);

      setBlocks((prev) =>
        prev.map((b) => {
          let next = b;
          if (b.st === 'Scheduled' && simT >= b.start && simT < b.start + b.dur) next = { ...next, st: 'In Progress' };
          if (next.st !== 'Completed' && simT >= b.start + b.dur) {
            next = { ...next, st: 'Completed' };
            simRef.current.completed += 1;
            pushFeedLocal(`✔ ${b.id} completed — ${b.dur}h possession released on ${b.sec}`, '#3E8E5B');
          }
          return next;
        })
      );

      SIM_INJECT.filter((x) => x.at === Math.round(simT)).forEach((x) => {
        setBlocks((prev) => [...prev, { ...x.b }]);
        setQueue((prev) => [
          {
            id: x.b.defect, dept: x.b.dept, sec: x.b.sec, st: 'Pending',
            sev: 24, ovd: 0, crit: 14, saf: 10, src: x.b.src,
            why: `Live defect received during 24h simulation — optimiser auto-planned block ${x.b.id}.`,
          },
          ...prev,
        ]);
        simRef.current.injected += 1;
        const deptName = depts[x.b.dept]?.name || x.b.dept;
        logAuditLocal('NEW DEFECT INGESTED', `${x.b.defect} (${deptName}) → auto-planned as ${x.b.id} on ${x.b.sec}`, 'SANCHALAN Optimiser');
        pushFeedLocal(`⚡ New defect ${x.b.defect} ingested → optimiser planned ${x.b.id} instantly`, '#B9812C');
      });

      if (simT >= END) {
        clearInterval(simRef.current.timer);
        simRef.current.timer = null;
        setNowH(simRef.current.startT);
        setSimRunning(false);
        const { completed, injected } = simRef.current;
        const msg = `⏩ Simulation complete: ${completed} blocks closed · ${injected} new defects auto-planned`;
        pushFeedLocal(msg, '#8FB4EC');
        showToast(msg);
      }
    }, SIM_TICK_MS);
  }, [sandbox, nowH, depts, pushFeedLocal, logAuditLocal, showToast]);

  useEffect(() => {
    return () => {
      if (simRef.current.timer) clearInterval(simRef.current.timer);
    };
  }, []);

  const value = {
    screen, setScreen,
    aiMode, setAiMode,
    depts, sections, kpis,
    blocks, queue, feed, audit,
    resolved, resolveConflict,
    panelBlock, setPanelBlock,
    toast, showToast,
    pushFeed, logAudit,
    approveBlock, overrideBlock,
    sandbox, toggleSandbox,
    scenario, previewScenario, applyScenario, discardScenario,
    simRunning, startSim,
    nowH,
    apiOnline,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
