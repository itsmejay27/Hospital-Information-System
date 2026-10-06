// Display helpers: the hospital runs 24 hours, but every time on screen uses AM/PM (no military time).
// Stored values stay "YYYY-MM-DD HH:mm[:ss]" so they keep sorting correctly.

const pad = (n: number) => String(n).padStart(2, "0");

/** "14:05" / "14:05:09" / "02:05 PM" → "2:05 PM". Anything else is returned unchanged. */
export function fmtTime(value?: string | null): string {
  if (!value) return "";
  const v = value.trim();
  if (/[ap]\.?m\.?$/i.test(v)) return v.replace(/^0(\d)/, "$1").replace(/\s*([ap])\.?m\.?$/i, (_m, x) => ` ${x.toUpperCase()}M`);
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}/.test(v)) return dt(v);
  const m = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return v;
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * Date + time for display: "2026-10-04 14:05:09" or ISO → "2026-10-04 2:05 PM".
 * Date-only values and other text are returned unchanged.
 */
export function dt(value?: string | null): string {
  if (!value) return "";
  const v = String(value).trim();
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/);
  if (!m) return v;
  if (m[3]) {
    // Absolute ISO time (UTC or offset): show it in the local time zone
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${fmtTime(`${d.getHours()}:${pad(d.getMinutes())}`)}`;
  }
  return `${m[1]} ${fmtTime(m[2])}`;
}

/** Current time as "2:05 PM" (used for queue check-in, visitor time-in, etc.). */
export const nowTime = () => {
  const d = new Date();
  return fmtTime(`${d.getHours()}:${pad(d.getMinutes())}`);
};

/** Half-hour time slots for pickers: [{ value: "14:30", label: "2:30 PM" }]. */
export function timeSlots(fromHour = 0, toHour = 24, stepMinutes = 30): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let m = fromHour * 60; m < toHour * 60; m += stepMinutes) {
    const value = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    out.push({ value, label: fmtTime(value) });
  }
  return out;
}
