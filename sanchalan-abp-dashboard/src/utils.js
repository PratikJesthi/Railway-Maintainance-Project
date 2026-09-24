// Helper to format fractional hours into HH:MM string
function fmtHourMin(hFloat) {
  const norm = ((hFloat % 24) + 24) % 24;
  let hh = Math.floor(norm);
  let mm = Math.round((norm - hh) * 60);
  if (mm >= 60) {
    hh = (hh + 1) % 24;
    mm = 0;
  }
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Formats an hour offset (from Monday 00:00 of the planning week) into a
// human-readable window, e.g. "Wed 04:00 → Wed 16:00" or "Mon 08:30 → Mon 10:00".
export function fmtWindow(s, dur) {
  if (s > 168) {
    const dayOfMonth = Math.floor(s / 24);
    return `Sep ${dayOfMonth}, ${fmtHourMin(s)} (+ ${(dur / 24).toFixed(1)}d)`;
  }
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const d = Math.min(6, Math.max(0, Math.floor(s / 24)));
  const e = s + dur;
  const ed = Math.min(6, Math.max(0, Math.floor(e / 24)));

  return `${days[d]} ${fmtHourMin(s)} → ${days[ed]} ${fmtHourMin(e)}`;
}
