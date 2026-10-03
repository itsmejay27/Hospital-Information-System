import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { ROLE_LABELS } from "../types";
import * as ui from "../components/tableStyles";

interface Kpi {
  label: string;
  value: string | number;
  hint: string;
  tone: string;
}

const peso = (n: number) => `₱${n.toLocaleString()}`;

function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(k => (
        <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{k.label}</div>
          <div className={`text-2xl font-extrabold mt-1 ${k.tone}`}>{k.value}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{k.hint}</div>
        </div>
      ))}
    </div>
  );
}

/** Home dashboard for Medical/Radiologic Technologists, Pharmacy, Finance (CFO) and Legal Counsel. */
export default function RoleDashboardView() {
  const { user } = useAuth();
  const { labResults, medications, claims, auditLogs } = useOpdData();
  const navigate = useNavigate();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  let kpis: Kpi[] = [];
  let actions: { label: string; to: string; primary?: boolean }[] = [];
  let tableTitle = "";
  let head: string[] = [];
  let body: React.ReactNode[][] = [];
  let emptyText = "";

  if (user.role === "medtech" || user.role === "radtech") {
    const imaging = user.role === "radtech";
    const list = labResults.filter(l => (imaging ? l.category === "Radiology" : l.category !== "Radiology"));
    const pending = list.filter(l => l.status === "Pending Analysis");
    const progress = list.filter(l => l.status === "In-Progress");
    kpis = [
      { label: "New Requests", value: pending.length, hint: "Waiting to be received", tone: "text-sky-700" },
      { label: "In Progress", value: progress.length, hint: "Results being entered", tone: "text-amber-700" },
      { label: "STAT / Urgent", value: [...pending, ...progress].filter(l => l.priority && l.priority !== "Routine").length, hint: "Do these first", tone: "text-rose-600" },
      { label: "Released Today", value: list.filter(l => l.status === "Ready" && (l.releasedAt || "").startsWith(today)).length, hint: "Sent to doctors", tone: "text-emerald-700" },
    ];
    actions = [{ label: imaging ? "Open Imaging Worklist" : "Open Laboratory Worklist", to: imaging ? "/imaging" : "/lab", primary: true }];
    tableTitle = "Waiting for you";
    head = ["Ordered", "Priority", "Patient", imaging ? "Study" : "Test", "Doctor", "Status"];
    body = [...pending, ...progress].slice(0, 8).map(l => [
      <span className="font-mono">{l.orderedAt || l.date}</span>,
      l.priority || "Routine",
      <span className="font-bold text-slate-900">{l.patientName}</span>,
      l.test,
      l.orderingPhysician,
      l.status === "Pending Analysis" ? "Ordered" : "In Progress",
    ]);
    emptyText = "No pending requests.";
  } else if (user.role === "pharmacy") {
    const pending = medications.filter(m => m.status === "Active" && !m.dispensedAt);
    kpis = [
      { label: "To Dispense", value: pending.length, hint: "Prescriptions waiting", tone: "text-sky-700" },
      { label: "Dispensed Today", value: medications.filter(m => (m.dispensedAt || "").startsWith(today)).length, hint: "Given to patients", tone: "text-emerald-700" },
      { label: "Active Prescriptions", value: medications.filter(m => m.status === "Active").length, hint: "All patients", tone: "text-slate-900" },
      { label: "Discontinued", value: medications.filter(m => m.status === "Discontinued").length, hint: "Do not dispense", tone: "text-rose-600" },
    ];
    actions = [{ label: "Open Pharmacy Dispensing", to: "/pharmacy", primary: true }];
    tableTitle = "Prescriptions to dispense";
    head = ["Prescribed", "Patient", "Medicine", "Dose", "Prescriber"];
    body = pending.slice(0, 8).map(m => [
      <span className="font-mono">{m.start}</span>,
      <span className="font-bold text-slate-900">{m.patientName}</span>,
      m.name,
      m.dose,
      m.prescribedBy,
    ]);
    emptyText = "Nothing waiting to be dispensed.";
  } else if (user.role === "finance") {
    const charges = claims.reduce((s, c) => s + (c.hospitalCharges || 0), 0);
    const benefit = claims.reduce((s, c) => s + (c.philhealthBenefit || 0), 0);
    const payable = claims.reduce((s, c) => s + (c.patientPayable || 0), 0);
    const open = claims.filter(c => c.claimStatus !== "Approved / Reimbursed");
    kpis = [
      { label: "Hospital Charges", value: peso(charges), hint: `${claims.length} claims`, tone: "text-slate-900" },
      { label: "PhilHealth Benefit", value: peso(benefit), hint: "Covered by PhilHealth", tone: "text-emerald-700" },
      { label: "Patient Payable", value: peso(payable), hint: "Out-of-pocket", tone: "text-sky-700" },
      { label: "Open Claims", value: open.length, hint: "Not yet reimbursed", tone: "text-amber-700" },
    ];
    actions = [
      { label: "PhilHealth & eClaims", to: "/philhealth", primary: true },
      { label: "Census & Reports", to: "/reports" },
    ];
    tableTitle = "Claims not yet reimbursed";
    head = ["Claim", "Member", "Diagnosis", "Benefit", "Status"];
    body = open.slice(0, 8).map(c => [
      <span className="font-mono">{c.id}</span>,
      <span className="font-bold text-slate-900">{c.memberName}</span>,
      c.diagnosisWithIcd,
      peso(c.philhealthBenefit),
      c.claimStatus,
    ]);
    emptyText = "All claims are reimbursed.";
  } else if (user.role === "legal") {
    kpis = [
      { label: "Audit Events Today", value: auditLogs.filter(l => l.timestamp.startsWith(today)).length, hint: "All staff activity", tone: "text-slate-900" },
      { label: "Flagged Events", value: auditLogs.filter(l => l.status === "Flagged").length, hint: "Need review", tone: "text-rose-600" },
      { label: "Account Changes", value: auditLogs.filter(l => /account|profile change/i.test(l.action)).length, hint: "Created, edited, suspended", tone: "text-amber-700" },
      { label: "Sign-ins Today", value: auditLogs.filter(l => l.action === "Signed in" && l.timestamp.startsWith(today)).length, hint: "Staff sessions", tone: "text-sky-700" },
    ];
    actions = [
      { label: "Open Audit Ledger", to: "/admin/audit-ledger", primary: true },
      { label: "Data Privacy & Compliance", to: "/admin/compliance" },
    ];
    tableTitle = "Latest activity";
    head = ["Time", "Staff", "Role", "Action", "Patient"];
    body = auditLogs.slice(0, 10).map(l => [
      <span className="font-mono whitespace-nowrap">{l.timestamp}</span>,
      <span className="font-bold text-slate-900">{l.userName}</span>,
      ROLE_LABELS[l.userRole] || l.userRole,
      l.action,
      l.targetPatient,
    ]);
    emptyText = "No activity recorded yet.";
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">Hello, {user.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {ROLE_LABELS[user.role]} • {user.department}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions.map(a => (
            <button key={a.to} onClick={() => navigate(a.to)} className={a.primary ? ui.primaryBtn : ui.secondaryBtn}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <KpiGrid items={kpis} />

      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <h2 className="text-sm font-bold text-slate-900">{tableTitle}</h2>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                {head.map(h => (
                  <th key={h} className={ui.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.length === 0 && (
                <tr>
                  <td colSpan={head.length} className={ui.emptyCell}>
                    {emptyText}
                  </td>
                </tr>
              )}
              {body.map((cells, i) => (
                <tr key={i} className={ui.tr}>
                  {cells.map((c, j) => (
                    <td key={j} className={ui.td}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
