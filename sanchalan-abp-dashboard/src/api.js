// Thin fetch wrapper around the SANCHALAN FastAPI backend.
// Base URL comes from VITE_API_BASE (see .env.example) so the same build
// can point at localhost in dev and a real host in prod.

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  bootstrap: () => request('/api/bootstrap'),

  listBlocks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/blocks${qs ? `?${qs}` : ''}`);
  },
  createBlock: (block) => request('/api/blocks', { method: 'POST', body: JSON.stringify(block) }),
  updateBlock: (id, patch) =>
    request(`/api/blocks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  listQueue: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/queue${qs ? `?${qs}` : ''}`);
  },

  listFeed: (limit = 12) => request(`/api/feed?limit=${limit}`),
  pushFeed: (text, color) => request('/api/feed', { method: 'POST', body: JSON.stringify({ text, color }) }),

  listAudit: (limit = 200) => request(`/api/audit?limit=${limit}`),
  logAudit: (action, detail, by) =>
    request('/api/audit', { method: 'POST', body: JSON.stringify({ action, detail, by }) }),
  auditExportUrl: () => `${BASE}/api/audit/export.csv`,

  listKpis: () => request('/api/kpis'),

  reportsUtilization: () => request('/api/reports/utilization'),
  reportsBacklogTrend: () => request('/api/reports/backlog-trend'),
  reportsCompliance: () => request('/api/reports/compliance'),
  reportsSummary: () => request('/api/reports/summary'),
  reportsExportSummaryUrl: () => `${BASE}/api/reports/export/summary.csv`,
  reportsExportBacklogUrl: () => `${BASE}/api/reports/export/backlog.csv`,

  listConflicts: () => request('/api/conflicts'),
  resolveConflict: (conflict_id, method, by) =>
    request('/api/conflicts/resolve', { method: 'POST', body: JSON.stringify({ conflict_id, method, by }) }),

  feedSocketUrl: () => `${BASE.replace(/^http/, 'ws')}/ws/feed`,
};
