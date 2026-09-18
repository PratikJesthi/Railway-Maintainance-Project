// Formats an hour offset (from Monday 00:00 of the planning week) into a
// human-readable window, e.g. "Wed 04:00 → Wed 16:00". Ported from the
// original vanilla dashboard's fmtWindow().
export function fmtWindow(s, dur) {
  if (s > 168) {
    return `Sep ${Math.floor(s / 24)}, ${String(s % 24).padStart(2, '0')}:00 (+ ${(dur / 24).toFixed(1)}d)`;
  }
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const d = Math.floor(s / 24);
  const h = s % 24;
  const e = s + dur;
  const ed = Math.floor(e / 24);
  const eh = e % 24;
  const p = (n) => (n < 10 ? '0' : '') + n;
  return `${days[d]} ${p(h)}:00 → ${days[Math.min(ed, 6)]} ${p(eh)}:00`;
}
