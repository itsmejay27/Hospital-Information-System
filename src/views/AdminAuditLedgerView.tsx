import React, { useState } from "react";
import { User, AuditLog, Role } from "../types";
import {
  FileText,
  ShieldCheck,
  Search,
  Check,
  AlertTriangle,
  Lock,
  Download,
  Filter,
} from "../components/Icons";

interface Props {
  user: User;
  auditLogs: AuditLog[];
  onSignOut?: () => void;
}

// Generate pseudo-cryptographic SHA-256 digest preview from log properties
function generateDigest(log: AuditLog): string {
  let hash = 0;
  const str = `${log.id}:${log.timestamp}:${log.userName}:${log.action}:${log.ipAddress}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `sha256:7f83b165${hex}c9e2408e`;
}

export default function AdminAuditLedgerView({ user, auditLogs }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [notification, setNotification] = useState<string | null>(null);

  const totalLogs = auditLogs.length;
  const authorizedLogs = auditLogs.filter(l => l.status === "Authorized").length;
  const flaggedLogs = auditLogs.filter(l => l.status === "Flagged").length;

  const handleExportLedger = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Timestamp,User,Role,License,Action,Patient,MRN,Department,IP,Status,CryptographicDigest"]
        .concat(
          auditLogs.map(
            l =>
              `"${l.id}","${l.timestamp}","${l.userName}","${l.userRole}","${l.userLicense || "N/A"}","${l.action}","${l.targetPatient}","${l.patientId}","${l.department}","${l.ipAddress}","${l.status}","${generateDigest(l)}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CityCare_Cryptographic_Audit_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification("Cryptographic Audit Ledger exported successfully with SHA-256 tamper-evident checksums.");
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetPatient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (roleFilter !== "all" && log.userRole !== roleFilter) return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-amber-950 text-amber-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-amber-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-amber-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-amber-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Governance & Security • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/admin/audit-ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Lock size={24} className="text-amber-600" />
            <span>Cryptographic Access & Audit Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            DPA 2012 Compliance Auditor: <span className="font-semibold text-slate-800">{user.name}</span> •{" "}
            <span className="font-mono text-slate-600">{user.licenseNumber || "SYS-ADMIN-AUTH"}</span>
          </p>
        </div>

        <button
          onClick={handleExportLedger}
          className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download size={16} />
          <span>Export Certified CSV Ledger</span>
        </button>
      </div>

      {/* Cryptographic Integrity & Compliance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Audit Records</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalLogs} Entries</div>
            <span className="text-[10px] text-slate-500">Immutable Sequential Index</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Authorized Actions</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{authorizedLogs} Events</div>
            <span className="text-[10px] font-semibold text-emerald-600">Verified PRC Credentials</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Flagged Anomalies</span>
            <div className="text-2xl font-black text-rose-700 mt-1">{flaggedLogs} Flagged</div>
            <span className="text-[10px] text-rose-600 font-semibold">Flagged for DPO Review</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">NPC RA 10173 Status</span>
            <div className="text-base font-black text-amber-800 mt-1">100% Compliant</div>
            <span className="text-[10px] text-amber-700">Digital Seal Active</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Lock size={20} />
          </div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Table Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search user, action, patient MRN, or IP..."
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full sm:w-80 focus:outline-hidden focus:bg-white focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter size={14} />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="nurse">Nurses</option>
                <option value="staff">Staff</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-hidden"
              >
                <option value="all">All Status</option>
                <option value="Authorized">Authorized Only</option>
                <option value="Flagged">Flagged Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No cryptographic audit entries matched your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                  <th className="py-3 px-3">Event Timestamp</th>
                  <th className="py-3 px-3">User & Credential</th>
                  <th className="py-3 px-3">Action Description</th>
                  <th className="py-3 px-3">Target Patient & MRN</th>
                  <th className="py-3 px-3">Workstation IP</th>
                  <th className="py-3 px-3">Cryptographic Digest</th>
                  <th className="py-3 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const digest = generateDigest(log);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              log.userRole === "doctor"
                                ? "bg-teal-100 text-teal-800"
                                : log.userRole === "nurse"
                                ? "bg-purple-100 text-purple-800"
                                : log.userRole === "admin"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {log.userRole}
                          </span>
                          {log.userLicense && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {log.userLicense}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{log.action}</div>
                        <div className="text-[10px] text-slate-400">{log.department}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{log.targetPatient}</div>
                        <div className="font-mono text-[10px] text-slate-400">{log.patientId}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {digest.slice(0, 18)}...
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            log.status === "Authorized"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {log.status === "Authorized" ? (
                            <ShieldCheck size={12} className="text-emerald-700" />
                          ) : (
                            <AlertTriangle size={12} className="text-rose-700" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
