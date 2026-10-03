import React from "react";
import { User, Role, ALL_ROLES, ROLE_LABELS } from "../types";
import PageHeader from "../components/PageHeader";
import * as ui from "../components/tableStyles";
import { KeyRound } from "../components/Icons";

interface Props {
  user: User;
  onSignOut?: () => void;
}

type Level = "full" | "limited" | "view";
interface ModuleAccess {
  module: string;
  description: string;
  access: Partial<Record<Role, { level: Level; note?: string }>>;
}

// Mirrors the route guards in App.tsx and the sidebar in OpdSidebar.tsx.
const MATRIX: ModuleAccess[] = [
  {
    module: "Patient Registration & Directory",
    description: "Register patients, master patient list, visitor log",
    access: { staff: { level: "full" } },
  },
  {
    module: "Patient Live Queue",
    description: "Waiting list, call next patient, queue status",
    access: { doctor: { level: "full" }, nurse: { level: "full" }, staff: { level: "full" } },
  },
  {
    module: "Clinical Care (SOAP, e-Prescriptions, Lab Orders)",
    description: "Consultations, diagnoses, prescriptions, diagnostic requests",
    access: { doctor: { level: "full" }, nurse: { level: "limited", note: "Vitals & BMI only" } },
  },
  {
    module: "Nursing Station",
    description: "ADPIE care plans, nurses' notes, endorsements, chief complaints",
    access: { nurse: { level: "full" }, doctor: { level: "limited", note: "Writes doctor's orders; reads nursing records" } },
  },
  {
    module: "Ward & Bed Allocation",
    description: "Admit patients to wards and beds",
    access: { staff: { level: "full" }, nurse: { level: "full" } },
  },
  {
    module: "Laboratory Worklist",
    description: "Receive specimens, enter and release lab results",
    access: { medtech: { level: "full" }, doctor: { level: "view" } },
  },
  {
    module: "Imaging Worklist",
    description: "Perform studies, write and release imaging reports",
    access: { radtech: { level: "full" }, doctor: { level: "view" } },
  },
  {
    module: "Pharmacy Dispensing",
    description: "Dispense prescriptions and record quantities",
    access: { pharmacy: { level: "full" }, doctor: { level: "view" } },
  },
  {
    module: "PhilHealth & eClaims",
    description: "File claims, update claim status",
    access: { finance: { level: "full" }, staff: { level: "full" }, doctor: { level: "full" } },
  },
  {
    module: "Census & Reports",
    description: "Morbidity, census and financial summaries",
    access: { finance: { level: "view" }, doctor: { level: "view" }, nurse: { level: "view" }, staff: { level: "view" } },
  },
  {
    module: "Staff Accounts & Approvals",
    description: "Create logins, assign roles, approve profile changes, public directory",
    access: { admin: { level: "full" } },
  },
  {
    module: "Audit Ledger",
    description: "Append-only record of every action (who, what, when)",
    access: { admin: { level: "view" }, legal: { level: "view" } },
  },
  {
    module: "Data Privacy & Compliance",
    description: "RA 10173 safeguards and access permissions",
    access: { admin: { level: "view" }, legal: { level: "view" } },
  },
  {
    module: "Duty Shifts",
    description: "Morning / Afternoon / Night schedules",
    access: Object.fromEntries(
      ALL_ROLES.map(r => [r, r === "admin" ? { level: "full" as Level, note: "Assigns shifts" } : { level: "view" as Level, note: "Own & roster" }])
    ),
  },
  {
    module: "My Settings",
    description: "Password, profile picture, profile change requests",
    access: Object.fromEntries(
      ALL_ROLES.map(r => [r, r === "admin" ? { level: "full" as Level } : { level: "limited" as Level, note: "Changes need approval" }])
    ),
  },
];

const cellStyle: Record<Level, string> = {
  full: "bg-emerald-50 text-emerald-800 border-emerald-200",
  limited: "bg-amber-50 text-amber-800 border-amber-200",
  view: "bg-sky-50 text-sky-800 border-sky-200",
};
const cellText: Record<Level, string> = { full: "Full", limited: "Limited", view: "View" };

export default function AdminRbacView({ user }: Props) {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<KeyRound size={20} />}
        title="Role Permissions (RBAC)"
        description={`What each of the ${ALL_ROLES.length} roles can open and do. Viewing as ${user.name} (${ROLE_LABELS[user.role]}).`}
      />

      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold">
        <span className="text-slate-500 uppercase tracking-wide font-bold">Legend:</span>
        {(Object.keys(cellText) as Level[]).map(l => (
          <span key={l} className={`px-2 py-0.5 rounded border ${cellStyle[l]}`}>
            {cellText[l]}
          </span>
        ))}
        <span className="text-slate-400">— = no access</span>
      </div>

      <div className={ui.tableWrap}>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={`${ui.th} sticky left-0 bg-slate-50 min-w-[220px]`}>Module</th>
                {ALL_ROLES.map(r => (
                  <th key={r} className={`${ui.th} text-center`}>
                    {ROLE_LABELS[r].replace(/ \(.*\)$/, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(m => (
                <tr key={m.module} className={ui.tr}>
                  <td className={`${ui.td} sticky left-0 bg-white`}>
                    <div className="font-bold text-slate-900">{m.module}</div>
                    <div className="text-[10px] text-slate-500">{m.description}</div>
                  </td>
                  {ALL_ROLES.map(r => {
                    const a = m.access[r];
                    return (
                      <td key={r} className={`${ui.td} text-center`}>
                        {a ? (
                          <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${cellStyle[a.level]}`} title={a.note}>
                            {cellText[a.level]}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                        {a?.note && <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{a.note}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
