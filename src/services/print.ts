import { dt } from "./time";
import { timestamp } from "./ids";

// Prints a simple, clean document (lab report, imaging report, statement of account)
// in a new window using the browser's print dialog ("Save as PDF" works too).

export const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function printDocument(title: string, bodyHtml: string, hospitalName = "CarePoint Medical Center"): boolean {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:32px;font-size:12px}
  h1{font-size:18px;margin:0}
  h2{font-size:14px;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.04em}
  .muted{color:#64748b}
  .head{display:flex;justify-content:space-between;border-bottom:2px solid #0f766e;padding-bottom:10px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  th,td{border-bottom:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f1f5f9;font-size:10px;text-transform:uppercase}
  .right{text-align:right}
  .flag{font-weight:bold;color:#be123c}
  .box{border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-top:8px;white-space:pre-line}
  .sign{margin-top:48px;display:flex;justify-content:flex-end}
  .sign div{border-top:1px solid #0f172a;padding-top:4px;min-width:260px;text-align:center}
  img{max-width:100%;max-height:420px;margin:6px 0;border:1px solid #e2e8f0}
  @media print{body{margin:12mm}}
</style></head><body>
<div class="head"><div><h1>${esc(hospitalName)}</h1><div class="muted">Hospital Information System</div></div>
<div class="right"><b>${esc(title)}</b><div class="muted">Printed ${esc(dt(timestamp()))}</div></div></div>
${bodyHtml}
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`);
  w.document.close();
  return true;
}

export function downloadCsv(filename: string, rows: (string | number | undefined | null)[][]): void {
  const csv = rows
    .map(r => r.map(v => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const peso = (n: number) => `₱${(Math.round(n * 100) / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
