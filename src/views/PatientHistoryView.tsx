import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MovementType, ROLE_LABELS } from "../types";
import { useMovementHistory } from "../hooks/useMovementHistory";
import { dt } from "../services/time";
import { downloadCsv, esc, printDocument } from "../services/print";
import PageHeader from "../components/PageHeader";
import * as ui from "../components/tableStyles";
import { History, Search } from "../components/Icons";
import PatientRecordPanel from "../components/PatientRecordPanel";
import { movementBadge, movementStyle, tierStyle, tierText } from "../components/movementStyles";

type Filter = "all" | "discharged" | "transferred" | "admitted" | "condition" | "opd";
const FILTERS: [Filter, string, MovementType[]][] = [
  ["all", "All", []],
  ["discharged", "Discharged", ["Discharged", "Sent Home (OPD)"]],
  ["transferred", "Transferred / Referred", ["Ward / Bed Transfer", "Referred / Transferred Out"]],
  ["admitted", "Admitted", ["Admitted"]],
  ["opd", "OPD Ward", ["Moved to OPD Ward"]],
  ["condition", "Condition Changes", ["Condition Updated"]],
];


/**
 * Transfer & Discharge History: every admission, ward/bed transfer, referral to another facility,
 * discharge and condition change, newest first. View History opens the patient's complete record.
 */
export default function PatientHistoryView() {
  const movements = useMovementHistory();
  const rows = movements.rows;
  const [params, setParams] = useSearchParams();
  const patientFilter = params.get("patient") || "";
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [viewing, setViewing] = useState<{ id: string; name: string } | null>(null);

  const types = FILTERS.find(f => f[0] === filter)![2];
  const q = search.toLowerCase();
  const shown = rows.filter(
    m =>
      (!patientFilter || m.patientId === patientFilter) &&
      (types.length === 0 || types.includes(m.type)) &&
      (!from || m.at.slice(0, 10) >= from) &&
      (!to || m.at.slice(0, 10) <= to) &&
      (!q || [m.patientName, m.patientId, m.from || "", m.to || "", m.details || "", m.by].some(v => v.toLowerCase().includes(q)))
  );
  const counts = Object.fromEntries(FILTERS.map(([id, , t]) => [id, rows.filter(m => t.length === 0 || t.includes(m.type)).length])) as Record<Filter, number>;
  const patientName = patientFilter ? rows.find(r => r.patientId === patientFilter)?.patientName : undefined;

  const exportCsv = () =>
    downloadCsv(`transfer_discharge_history_${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Date & Time", "Patient ID", "Patient", "Movement", "From", "To", "Condition Before", "Condition After", "Details", "Recorded By"],
      ...shown.map(m => [dt(m.at), m.patientId, m.patientName, m.type, m.from, m.to, tierText(m.conditionBefore), tierText(m.conditionAfter), m.details, m.by]),
    ]);
  const print = () =>
    printDocument(
      patientName ? `Patient Movement History — ${patientName}` : "Transfer & Discharge History",
      `<table><tr><th>Date & Time</th><th>Patient</th><th>Movement</th><th>From → To</th><th>Condition</th><th>Details</th><th>By</th></tr>${shown
        .map(
          m =>
            `<tr><td>${esc(dt(m.at))}</td><td>${esc(m.patientName)}<br><span class="muted">${esc(m.patientId)}</span></td><td>${esc(m.type)}</td><td>${esc(
              [m.from, m.to].filter(Boolean).join(" → ")
            )}</td><td>${esc([tierText(m.conditionBefore), tierText(m.conditionAfter)].filter(Boolean).join(" → "))}</td><td>${esc(m.details || "")}</td><td>${esc(m.by)}</td></tr>`
        )
        .join("")}</table>`
    );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<History size={20} />}
        title={patientName ? `Movement History — ${patientName}` : "Transfer & Discharge History"}
        description="Every admission, ward or bed transfer, referral to another hospital, discharge and condition change, newest first."
        actions={
          <>
            <button onClick={exportCsv} className={ui.secondaryBtn}>
              Export CSV
            </button>
            <button onClick={print} className={ui.secondaryBtn}>
              Print
            </button>
          </>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${filter === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === id ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>{counts[id]}</span>
          </button>
        ))}
      </div>

      <div className={ui.tableWrap}>
        <div className={`${ui.toolbar} flex-wrap`}>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, ward, hospital..." className={`${ui.input} pl-8`} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              From <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={ui.inlineInput} />
            </label>
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              To <input type="date" value={to} onChange={e => setTo(e.target.value)} className={ui.inlineInput} />
            </label>
            {(from || to || search) && (
              <button
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setSearch("");
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Clear
              </button>
            )}
            {patientFilter && (
              <>
                <button onClick={() => setViewing({ id: patientFilter, name: patientName || patientFilter })} className={ui.primaryBtn}>
                  <History size={14} /> View Full History
                </button>
                <button onClick={() => setParams({})} className={ui.secondaryBtn}>
                  Show all patients
                </button>
              </>
            )}
          </div>
        </div>
        {movements.error && <div className="px-4 py-2 text-xs font-semibold text-rose-700">{movements.error}</div>}
        <div className={ui.tableScroll}>
          {/* Fixed column widths and two-line cells keep every row the same size; the full text is in View History */}
          <table className={`${ui.table} table-fixed min-w-[1250px]`}>
            <colgroup>
              <col className="w-[104px]" />
              <col className="w-[165px]" />
              <col className="w-[188px]" />
              <col className="w-[185px]" />
              <col className="w-[132px]" />
              <col />
              <col className="w-[150px]" />
              <col className="w-[128px]" />
            </colgroup>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Date &amp; Time</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Movement</th>
                <th className={ui.th}>From → To</th>
                <th className={ui.th}>Condition</th>
                <th className={ui.th}>Details</th>
                <th className={ui.th}>Recorded By</th>
                <th className={`${ui.th} text-right`}>History</th>
              </tr>
            </thead>
            <tbody>
              {movements.loading && (
                <tr>
                  <td colSpan={8} className={ui.emptyCell}>Loading…</td>
                </tr>
              )}
              {!movements.loading && shown.length === 0 && (
                <tr>
                  <td colSpan={8} className={ui.emptyCell}>No records for this filter.</td>
                </tr>
              )}
              {shown.map(m => {
                const [date, ...time] = dt(m.at).split(" ");
                return (
                  <tr key={m.id} className="h-16 border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className={`${ui.td} align-middle font-mono whitespace-nowrap`}>
                      <div className="text-slate-800">{date}</div>
                      <div className="text-[10px] text-slate-500">{time.join(" ")}</div>
                    </td>
                    <td className={`${ui.td} align-middle`}>
                      <button
                        onClick={() => setParams({ patient: m.patientId })}
                        title={`Show only ${m.patientName}`}
                        className="block w-full truncate font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left cursor-pointer"
                      >
                        {m.patientName}
                      </button>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{m.patientId}</div>
                    </td>
                    <td className={`${ui.td} align-middle`}>
                      <span className={`${movementBadge} ${movementStyle[m.type]}`}>{m.type}</span>
                    </td>
                    <td className={`${ui.td} align-middle`} title={[m.from, m.to].filter(Boolean).join(" → ")}>
                      <div className="truncate text-slate-500">{m.from || "—"}</div>
                      {m.to && <div className="truncate font-semibold text-slate-900">→ {m.to}</div>}
                    </td>
                    <td className={`${ui.td} align-middle`}>
                      {m.conditionBefore || m.conditionAfter ? (
                        <div className="flex flex-col items-start gap-1 whitespace-nowrap">
                          {m.conditionBefore && m.conditionBefore !== m.conditionAfter && (
                            <span className={`${ui.badge} ${tierStyle[m.conditionBefore]}`}>{tierText(m.conditionBefore)}</span>
                          )}
                          {m.conditionAfter && (
                            <span className="flex items-center gap-1">
                              {m.conditionBefore && m.conditionBefore !== m.conditionAfter && <span className="text-slate-400">→</span>}
                              <span className={`${ui.badge} ${tierStyle[m.conditionAfter]}`}>{tierText(m.conditionAfter)}</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className={`${ui.td} align-middle`} title={m.details || ""}>
                      <p className="line-clamp-2 break-words text-slate-600">{m.details || "—"}</p>
                    </td>
                    <td className={`${ui.td} align-middle`}>
                      <div className="truncate" title={m.by}>
                        {m.by}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{ROLE_LABELS[m.byRole] || m.byRole}</div>
                    </td>
                    <td className="px-2 py-2.5 align-middle text-right">
                      <button
                        onClick={() => setViewing({ id: m.patientId, name: m.patientName })}
                        className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[11px] font-bold cursor-pointer"
                      >
                        <History size={12} /> View History
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {viewing && <PatientRecordPanel patientId={viewing.id} patientName={viewing.name} onClose={() => setViewing(null)} />}
    </div>
  );
}
