import { useState } from "react";
import { User, AuditLog } from "../types";
import { DEMO_USERS } from "../mockData";
import {
  FileText,
  KeyRound,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
} from "../components/Icons";

interface Props {
  user: User;
  auditLogs: AuditLog[];
  onSignOut: () => void;
}

type AdminTab = "audit" | "rbac" | "users" | "security";

interface RbacRow {
  feature: string;
  patient: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  doctor: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  nurse: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  staff: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  admin: { status: "denied" | "allowed" | "read" | "audit"; text: string };
}

function RbacBadge({ entry }: { entry: { status: "denied" | "allowed" | "read" | "audit"; text: string } }) {
  if (entry.status === "denied") {
    return (
      <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
        <XCircle size={14} className="text-rose-600 flex-shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  if (entry.status === "allowed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
        <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  if (entry.status === "read") {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
        <Eye size={14} className="text-slate-500 flex-shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
      <ShieldCheck size={14} className="text-amber-600 flex-shrink-0" strokeWidth={2} />
      <span>{entry.text}</span>
    </span>
  );
}

export default function AdminCompliance({
  user,
  auditLogs,
}: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>("audit");
  const [logFilter, setLogFilter] = useState("all");

  const rbacMatrix: RbacRow[] = [
    {
      feature: "1. Patient Registration & Intake",
      patient: { status: "denied", text: "Denied (Self-registration only)" },
      doctor: { status: "allowed", text: "Full Access" },
      nurse: { status: "allowed", text: "Full Access" },
      staff: { status: "allowed", text: "Primary Allocator" },
      admin: { status: "allowed", text: "Full Control" },
    },
    {
      feature: "1. Inpatient Bed Allocation",
      patient: { status: "denied", text: "Denied" },
      doctor: { status: "allowed", text: "Order Admission" },
      nurse: { status: "allowed", text: "Bedside Intake" },
      staff: { status: "allowed", text: "Primary Allocator" },
      admin: { status: "allowed", text: "Full Control" },
    },
    {
      feature: "2. Creation & Updating of EHR",
      patient: { status: "read", text: "Read-Only (Own records)" },
      doctor: { status: "allowed", text: "Primary Author / Sign" },
      nurse: { status: "allowed", text: "Nursing Notes" },
      staff: { status: "read", text: "Demographics Only" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "3. Prescribe Medications",
      patient: { status: "denied", text: "Denied (Refill requests only)" },
      doctor: { status: "allowed", text: "Primary Prescriber" },
      nurse: { status: "denied", text: "Denied (Read-only)" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "3. Medication Administration Record (MAR)",
      patient: { status: "read", text: "Read Schedule" },
      doctor: { status: "read", text: "Review Execution" },
      nurse: { status: "allowed", text: "Record Administration" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "4. Data Privacy & Confidentiality",
      patient: { status: "allowed", text: "Manage Personal Consent" },
      doctor: { status: "read", text: "Clinical Compliance" },
      nurse: { status: "read", text: "Clinical Compliance" },
      staff: { status: "read", text: "Protocol Adherence" },
      admin: { status: "allowed", text: "Master DPA Control" },
    },
    {
      feature: "5. Lab Diagnostic Result Retrieval",
      patient: { status: "allowed", text: "View & Download (Own)" },
      doctor: { status: "allowed", text: "Review & Order" },
      nurse: { status: "allowed", text: "View for Ward Care" },
      staff: { status: "read", text: "Status Only" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
  ];

  const filteredLogs = auditLogs.filter(l => {
    if (logFilter === "all") return true;
    return l.userRole === logFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2744] to-[#1e3a5f] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0">
              {user.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Hospital Administration & DPA Compliance Console
                </span>
                <span className="text-xs text-slate-300">Admin ID: <strong>{user.id}</strong></span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white">{user.name}</h1>
              <div className="text-xs text-slate-300 mt-1">
                {user.title} · {user.department}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-4 py-2 text-xs text-emerald-300 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RA 10173 / NPC Compliant</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <FileText size={16} className="flex-shrink-0" />
            <span>Access Audit Ledger ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("rbac")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "rbac"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <KeyRound size={16} className="flex-shrink-0" />
            <span>RBAC Permissions Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Users size={16} className="flex-shrink-0" />
            <span>User & Account Management</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "security"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ShieldCheck size={16} className="flex-shrink-0" />
            <span>DPA 2012 Compliance Status</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: AUDIT LEDGER */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4 mb-5">
              <div>
                <h2 className="font-semibold text-lg text-[var(--foreground)]">
                  Cryptographic Access & Transaction Audit Trail
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Permanent immutable ledger of all patient record interactions per Section 20 of RA 10173
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filter Role:</span>
                <select
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value)}
                  className="border rounded-md px-3 py-1.5 text-xs bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="staff">Staff</option>
                  <option value="patient">Patient</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[var(--muted-foreground)] uppercase font-semibold border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Account & Role</th>
                    <th className="px-4 py-3">Action Performed</th>
                    <th className="px-4 py-3">Target Patient</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">IP / Device</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--foreground)]">{log.userName}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)] uppercase">{log.userRole}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{log.action}</td>
                      <td className="px-4 py-3 text-slate-700">{log.targetPatient}</td>
                      <td className="px-4 py-3 text-slate-600">{log.department}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{log.ipAddress}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: RBAC MATRIX */}
      {activeTab === "rbac" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg text-[var(--foreground)] mb-1">
              Role-Based Access Control (RBAC) System Matrix
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Complete specification of permission segregation across all 5 standard HIS modules.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[var(--muted-foreground)] uppercase font-semibold border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3">Standard HIS Module</th>
                    <th className="px-3 py-3 bg-teal-50 text-teal-900">Patient</th>
                    <th className="px-3 py-3">Doctor</th>
                    <th className="px-3 py-3">Nurse</th>
                    <th className="px-3 py-3">Staff</th>
                    <th className="px-3 py-3">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {rbacMatrix.map(row => (
                    <tr key={row.feature} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{row.feature}</td>
                      <td className="px-3 py-3 bg-teal-50/50">
                        <RbacBadge entry={row.patient} />
                      </td>
                      <td className="px-3 py-3">
                        <RbacBadge entry={row.doctor} />
                      </td>
                      <td className="px-3 py-3">
                        <RbacBadge entry={row.nurse} />
                      </td>
                      <td className="px-3 py-3">
                        <RbacBadge entry={row.staff} />
                      </td>
                      <td className="px-3 py-3">
                        <RbacBadge entry={row.admin} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: USERS */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg text-[var(--foreground)] mb-1">Hospital Predefined User Accounts</h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Configured roles with authentication credentials for testing and clinical access.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DEMO_USERS).map(([username, data]) => (
                <div key={username} className="border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--foreground)]">{data.user.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold uppercase px-2 py-0.5 rounded">
                        {data.user.role}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{data.user.title} · {data.user.department}</div>
                    <div className="text-xs font-mono text-slate-600 mt-1">
                      User: <strong>{username}</strong> · Password: <strong>pass</strong>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: SECURITY & COMPLIANCE */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-lg text-[var(--foreground)]">DPA 2012 Compliance Status Report</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Evaluation of technical and organizational security measures per NPC Circular 16-01
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 mb-3 shadow-2xs">
                  <Lock size={18} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm text-[var(--foreground)]">Data Encryption</div>
                <div className="text-xs text-slate-600 mt-1">AES-256 for EHR tables at rest; TLS 1.3 for API transit.</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 mb-3 shadow-2xs">
                  <ShieldCheck size={18} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm text-[var(--foreground)]">Role Isolation</div>
                <div className="text-xs text-slate-600 mt-1">Strict RBAC preventing patient access to clinical intake and charting.</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 mb-3 shadow-2xs">
                  <FileText size={18} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm text-[var(--foreground)]">Audit Trails</div>
                <div className="text-xs text-slate-600 mt-1">Immutable access logging for all patient record retrievals.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
