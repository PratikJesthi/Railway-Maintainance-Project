// SANCHALAN — static UI config (department colors, section list, and the
// 24h simulation's fake injected defects). This used to also hold the mock
// operational data (blocks/queue/feed/audit/KPIs) — that's now fetched live
// from the real backend via AppContext (see /api/bootstrap), not here.
// Corridor: NDLS (New Delhi) -> BPL (Bhopal) via MTJ, AGC, GWL, JHS

export const DEPTS = {
  ENG: { code: 'ENG', name: 'Engineering (P.Way)', short: 'Engg.', color: '#0F7A73', tint: '#EAF7F6', text: '#0B615C' },
  TRAC: { code: 'TRAC', name: 'Traction (OHE)', short: 'Traction', color: '#B9812C', tint: '#FBF1DE', text: '#8A6120' },
  SNT: { code: 'SNT', name: 'Signal & Telecom', short: 'S&T', color: '#7C5AA6', tint: '#F1ECF8', text: '#5E4380' },
  Merged: { code: 'Merged', name: 'Combined Block', short: 'Combined', color: '#3E8E5B', tint: '#EAF6EE', text: '#2E6D44' },
};

export const SECTIONS = ['NDLS–MTJ', 'MTJ–AGC', 'AGC–GWL', 'GWL–JHS', 'JHS–BPL', 'BPL–ET'];

// Fallback "now" used only before the real bootstrap fetch resolves.
export const NOW_H = 10.7;

// Live defects injected partway through a "Simulate 24h" run. This stays
// client-side/fake — the backend has no matching endpoint (no real-time
// defect-ingestion feed), see tasks.md "Future work".
// `at` is the absolute Monday-00:00 hour at which the defect arrives.
export const SIM_INJECT = [
  { at: 14, block: { id: 'B-112', sec: 'NDLS–MTJ', dept: 'ENG', start: 14, dur: 8, defect: 'ENG-1401', sev: 'High', overdue: 0, src: 'SMMS', st: 'Pending', note: 'Live defect injected during simulation — auto-planned by optimiser.', conflict: false } },
  { at: 19, block: { id: 'B-113', sec: 'MTJ–AGC', dept: 'SNT', start: 19, dur: 10, defect: 'SNT-1105', sev: 'Critical', overdue: 0, src: 'TDMS', st: 'Pending', note: 'Live defect injected during simulation — auto-planned by optimiser.', conflict: false } },
  { at: 25, block: { id: 'B-114', sec: 'GWL–JHS', dept: 'TRAC', start: 25, dur: 9, defect: 'TRAC-2607', sev: 'Medium', overdue: 0, src: 'TDMS', st: 'Pending', note: 'Live defect injected during simulation — auto-planned by optimiser.', conflict: false } },
];
