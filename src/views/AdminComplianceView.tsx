import React from "react";
import { User, HospitalConfig } from "../types";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileText,
  AlertTriangle,
  Building2,
} from "../components/Icons";

interface Props {
  user: User;
  hospitalConfig: HospitalConfig;
  onSignOut?: () => void;
}

export default function AdminComplianceView({ user, hospitalConfig }: Props) {
  const complianceItems = [
    {
      title: "Republic Act No. 10173 (Data Privacy Act of 2012)",
      status: "Fully Compliant",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description:
        "CityCare General enforces strict organizational, physical, and technical measures for safeguarding Sensitive Personal Information (SPI) including health diagnoses, prescriptions, and biometric data.",
    },
    {
      title: "National Privacy Commission (NPC) Circular Compliance",
      status: "Registered & Verified",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description:
        `Hospital facility registration filed with the NPC. Designated Data Protection Officer (DPO): ${hospitalConfig.dpoEmail || "dpo@citycarehospital.ph"}.`,
    },
    {
      title: "Mandatory 72-Hour Security Incident Protocol",
      status: "Protocol Active",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description:
        "Automated notification pipelines configured to alert the NPC and affected data subjects within 72 hours of identifying any high-risk data breach involving sensitive health records.",
    },
    {
      title: "Cryptographic Tamper-Evident Audit Trail",
      status: "Enforced (SHA-256)",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description:
        "Every patient record access, modification, prescription issuance, and PhilHealth transmission is logged with workstation IP, user license credentials, and SHA-256 digest validation.",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Legal & Privacy Compliance • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/admin/compliance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck size={24} className="text-amber-600" />
            <span>Security & NPC Compliance Guidelines (DPA 2012)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compliance Auditor: <span className="font-semibold text-slate-800">{user.name}</span> • National Privacy Commission (NPC) Standards
          </p>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="space-y-4">
        {complianceItems.map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{item.title}</span>
              </h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.badge}`}>
                {item.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* DPO Contact Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2 mb-2">
          <Lock size={18} />
          <span>Institutional Data Protection Officer (DPO) Inquiries</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          For patient privacy concerns, access requests under RA 10173, or security audit logs verification, contact the CityCare General Data Protection Office directly at{" "}
          <strong className="text-white font-mono">{hospitalConfig.dpoEmail || "dpo@citycarehospital.ph"}</strong> or via the administrative desk at{" "}
          <span className="font-mono">{hospitalConfig.phone}</span>.
        </p>
      </div>
    </div>
  );
}
