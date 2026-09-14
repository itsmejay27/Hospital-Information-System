import React from "react";
import { User } from "../types";
import {
  KeyRound,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
} from "../components/Icons";

interface Props {
  user: User;
  onSignOut?: () => void;
}

interface RbacRow {
  feature: string;
  doctor: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  nurse: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  staff: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  admin: { status: "denied" | "allowed" | "read" | "audit"; text: string };
}

function RbacBadge({ entry }: { entry: { status: "denied" | "allowed" | "read" | "audit"; text: string } }) {
  if (entry.status === "denied") {
    return (
      <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
        <XCircle size={14} className="text-rose-600 shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  if (entry.status === "allowed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  if (entry.status === "read") {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
        <Eye size={14} className="text-slate-500 shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
      <ShieldCheck size={14} className="text-amber-600 shrink-0" strokeWidth={2} />
      <span>{entry.text}</span>
    </span>
  );
}

export default function AdminRbacView({ user }: Props) {
  const rbacMatrix: RbacRow[] = [
    {
      feature: "1. Patient Registration & Inpatient Bed Allocation",
      doctor: { status: "read", text: "Read-only Roster" },
      nurse: { status: "allowed", text: "Bed Management & MAR" },
      staff: { status: "allowed", text: "Full Intake Authority" },
      admin: { status: "audit", text: "Audit Ledger Only" },
    },
    {
      feature: "2. Clinical Encounters, SOAP Notes & Prescriptions",
      doctor: { status: "allowed", text: "Primary Prescriber" },
      nurse: { status: "denied", text: "Denied (Read-only)" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "3. Bedside Vitals, BMI & Medication Administration (MAR)",
      doctor: { status: "read", text: "Review Flowsheet" },
      nurse: { status: "allowed", text: "Full Logging Authority" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "4. Healthcare Worker Account Provisioning",
      doctor: { status: "denied", text: "Denied" },
      nurse: { status: "denied", text: "Denied" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "allowed", text: "Exclusive Authority" },
    },
    {
      feature: "5. Laboratory & Diagnostic Results Release",
      doctor: { status: "allowed", text: "Order & Interpret" },
      nurse: { status: "allowed", text: "View for Ward Care" },
      staff: { status: "read", text: "Status Only" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "6. Hospital Branding & Master System Configuration",
      doctor: { status: "denied", text: "Denied" },
      nurse: { status: "denied", text: "Denied" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "allowed", text: "Master Config Control" },
    },
    {
      feature: "7. PhilHealth eClaims Adjudication & Transmission",
      doctor: { status: "allowed", text: "Clinical Certification" },
      nurse: { status: "denied", text: "Denied" },
      staff: { status: "allowed", text: "Claims Processing" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Access Governance • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/admin/rbac</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <KeyRound size={24} className="text-amber-600" />
            <span>Role-Based Access Control (RBAC) Permissions Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enforced by Policy Guard • Principle of Least Privilege across Doctor, Nurse, Staff & Admin Roles
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-3 px-4 min-w-[240px]">Hospital System Module / Capability</th>
                <th className="py-3 px-4 min-w-[150px]">Doctor (Clinician)</th>
                <th className="py-3 px-4 min-w-[150px]">Nurse (Ward Care)</th>
                <th className="py-3 px-4 min-w-[150px]">Staff (Admissions)</th>
                <th className="py-3 px-4 min-w-[150px]">Admin (Security)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rbacMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-4">
                    <RbacBadge entry={row.doctor} />
                  </td>
                  <td className="py-3.5 px-4">
                    <RbacBadge entry={row.nurse} />
                  </td>
                  <td className="py-3.5 px-4">
                    <RbacBadge entry={row.staff} />
                  </td>
                  <td className="py-3.5 px-4">
                    <RbacBadge entry={row.admin} />
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
