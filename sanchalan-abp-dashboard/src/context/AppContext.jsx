import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api';
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

  const value = {
    screen, setScreen,
    aiMode, setAiMode,
    depts, sections, kpis,
    blocks, queue, feed, audit,
    resolved, resolveConflict,
    panelBlock, setPanelBlock,
    toast, showToast,
    pushFeed, logAudit,
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
