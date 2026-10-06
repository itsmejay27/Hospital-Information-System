import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useOpdData } from "../context/OpdDataContext";
import { MovementType, PatientMovement, ROLE_LABELS, TriageTier } from "../types";
import { useCollection } from "../hooks/useCollection";
import { dt } from "../services/time";
import { downloadCsv, esc, printDocument } from "../services/print";
import PageHeader from "../components/PageHeader";
import * as ui from "../components/tableStyles";
import { History, Search } from "../components/Icons";

type Filter = "all" | "discharged" | "transferred" | "admitted" | "condition" | "opd";
const FILTERS: [Filter, string, MovementType[]][] = [
  ["all", "All", []],
  ["discharged", "Discharged", ["Discharged", "Sent Home (OPD)"]],
  ["transferred", "Transferred / Referred", ["Ward / Bed Transfer", "Referred / Transferred Out"]],
  ["admitted", "Admitted", ["Admitted"]],
  ["opd", "OPD Ward", ["Moved to OPD Ward"]],
  ["condition", "Condition Changes", ["Condition Updated"]],
];

const typeStyle: Record<MovementType, string> = {
  "Moved to OPD Ward": "bg-teal-50 text-teal-700 border-teal-200",
  Admitted: "bg-sky-50 text-sky-700 border-sky-200",
  "Ward / Bed Transfer": "bg-violet-50 text-violet-700 border-violet-200",
  "Referred / Transferred Out": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Discharged: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Sent Home (OPD)": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Condition Updated": "bg-amber-50 text-amber-800 border-amber-200",
};
const tierText = (t?: TriageTier) => (t ? t[0].toUpperCase() + t.slice(1) : "");

/**
 * Transfer & Discharge History: every admission, ward/bed transfer, referral to another facility,
 * discharge and condition change, newest first. Older records (made before this history existed)
 * are rebuilt from the discharge, referral and admission records.
 */
export default function PatientHistoryView() {
  const { discharges, referrals, admissions } = useOpdData();
  const movements = useCollection<PatientMovement>("patient_movements");
  const [params, setParams] = useSearchParams();
  const patientFilter = params.get("patient") || "";
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => {
    const logged = new Set(movements.items.map(m => `${m.sourceId}|${m.type}`));
    const legacy: PatientMovement[] = [];
    const add = (m: PatientMovement) => {
      if (!logged.has(`${m.sourceId}|${m.type}`)) legacy.push(m);
    };
    discharges.forEach(d => {
      const outside = /Tertiary|Referred/i.test(d.disposition);
      const admitted = /Inpatient Ward/i.test(d.disposition);
      add({
        id: `legacy-${d.id}`,
        patientId: d.patientId,
        patientName: d.patientName,
        type: admitted ? "Admitted" : outside ? "Referred / Transferred Out" : "Discharged",
        to: admitted ? "Inpatient ward" : outside ? d.disposition : "Home",
        conditionBefore: d.triageBeforeDischarge,
        conditionAfter: admitted ? undefined : "stable",
        details: `${d.disposition}${d.conditionAtDischarge ? ` • Condition: ${d.conditionAtDischarge}` : ""}${d.followUpDate ? ` • Follow-up ${d.followUpDate}` : ""}`,
        at: d.dischargeDate,
        by: d.clearedByDoctor,
        byRole: "doctor",
        sourceId: d.id,
      });
    });
    referrals.forEach(r =>
      add({
        id: `legacy-${r.id}`,
        patientId: r.patientId,
        patientName: r.patientName,
        type: "Referred / Transferred Out",
        from: r.referredFrom,
        to: r.referredTo,
        details: `${r.priority}: ${r.reason} (${r.status})`,
        at: r.timestamp,
        by: r.referringDoctor,
        byRole: "doctor",
        sourceId: r.id,
      })
    );
    admissions.forEach(a => {
      // If the patient was transferred since, the first transfer's "from" is the original bed
      const firstTransfer = movements.items
        .filter(m => m.sourceId === a.id && m.type === "Ward / Bed Transfer")
        .sort((x, y) => x.at.localeCompare(y.at))[0];
      add({
        id: `legacy-adm-${a.id}`,
        patientId: a.patientId,
        patientName: a.patientName,
        type: "Admitted",
        from: "OPD",
        to: firstTransfer?.from || `${a.ward} / ${a.bed}`,
        details: a.reason,
        at: a.admissionDate,
        by: a.admittingStaff,
        byRole: "staff",
        sourceId: a.id,
      });
      if (a.status === "Discharged")
        add({
          id: `legacy-dis-${a.id}`,
          patientId: a.patientId,
          patientName: a.patientName,
          type: "Discharged",
          from: `${a.ward} / ${a.bed}`,
          to: "Home",
          details: "Bed vacated",
          at: a.dischargeDate || a.admissionDate,
          by: a.attendingPhysician,
          byRole: "doctor",
          sourceId: a.id,
        });
    });
    return [...movements.items, ...legacy].sort((x, y) => y.at.localeCompare(x.at));
  }, [movements.items, discharges, referrals, admissions]);

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
          <label className="text-[11px] text-slate-500 flex items-center gap-1">
            From <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={`${ui.input} w-auto`} />
          </label>
          <label className="text-[11px] text-slate-500 flex items-center gap-1">
            To <input type="date" value={to} onChange={e => setTo(e.target.value)} className={`${ui.input} w-auto`} />
          </label>
          {patientFilter && (
            <button onClick={() => setParams({})} className={ui.secondaryBtn}>
              Show all patients
            </button>
          )}
        </div>
        {movements.error && <div className="px-4 py-2 text-xs font-semibold text-rose-700">{movements.error}</div>}
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Date &amp; Time</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Movement</th>
                <th className={ui.th}>From → To</th>
                <th className={ui.th}>Condition</th>
                <th className={ui.th}>Details</th>
                <th className={ui.th}>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {movements.loading && (
                <tr>
                  <td colSpan={7} className={ui.emptyCell}>Loading…</td>
                </tr>
              )}
              {!movements.loading && shown.length === 0 && (
                <tr>
                  <td colSpan={7} className={ui.emptyCell}>No records for this filter.</td>
                </tr>
              )}
              {shown.map(m => (
                <tr key={m.id} className={ui.tr}>
                  <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(m.at)}</td>
                  <td className={ui.td}>
                    <button onClick={() => setParams({ patient: m.patientId })} className="font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left cursor-pointer">
                      {m.patientName}
                    </button>
                    <div className="text-[10px] font-mono text-slate-400">{m.patientId}</div>
                  </td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${typeStyle[m.type]}`}>{m.type}</span>
                  </td>
                  <td className={ui.td}>
                    {m.from && <div className="text-slate-500">{m.from}</div>}
                    {m.to && <div className="font-semibold text-slate-900">→ {m.to}</div>}
                  </td>
                  <td className={`${ui.td} whitespace-nowrap`}>
                    {m.conditionBefore && m.conditionAfter && m.conditionBefore === m.conditionAfter ? (
                      <span className="text-emerald-700 font-bold">{tierText(m.conditionAfter)}</span>
                    ) : m.conditionBefore || m.conditionAfter ? (
                      <>
                        {m.conditionBefore && <span className={m.conditionBefore === "critical" ? "text-rose-700 font-bold" : ""}>{tierText(m.conditionBefore)}</span>}
                        {m.conditionBefore && m.conditionAfter && " → "}
                        {m.conditionAfter && <span className="text-emerald-700 font-bold">{tierText(m.conditionAfter)}</span>}
                      </>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={ui.td}>
                    <div className="max-w-[280px] text-slate-600">{m.details || "—"}</div>
                  </td>
                  <td className={ui.td}>
                    {m.by}
                    <div className="text-[10px] text-slate-400">{ROLE_LABELS[m.byRole] || m.byRole}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
