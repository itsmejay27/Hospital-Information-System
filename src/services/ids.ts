/** Collision-safe id suffix: base-36 timestamp plus random characters (e.g. "MUSA1B2C7QX"). */
export function uid(): string {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

/** Local time as "YYYY-MM-DD HH:mm:ss" (sorts correctly as text). */
export function timestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
}
