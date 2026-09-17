import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  X,
  LogIn,
  Stethoscope,
  Syringe,
  ClipboardList,
  ShieldCheck,
  AlertCircle,
  Lock,
} from "./Icons";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin";
}

export default function AuthModal({
  isOpen,
  onClose,
}: AuthModalProps) {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Sign In form state
  const [signInUsername, setSignInUsername] = useState("dr.jacobe");
  const [signInPassword, setSignInPassword] = useState("pass");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setIsLoading(true);

    setTimeout(() => {
      const success = login(signInUsername, signInPassword);
      setIsLoading(false);
      if (success) {
        onClose();
        navigate("/dashboard");
      } else {
        setSignInError(
          "Invalid credentials. Please select one of the authorized staff demo profiles below or verify your username."
        );
      }
    }, 200);
  };

  const handleQuickLogin = (uname: string) => {
    setSignInError(null);
    const success = login(uname, "pass");
    if (success) {
      onClose();
      navigate("/dashboard");
    } else {
      setSignInError(`Unable to authenticate as ${uname}`);
    }
  };

  const quickStaffProfiles = [
    {
      name: "Dr. Mark Arkiel Jacobe",
      username: "dr.jacobe",
      role: "Doctor",
      title: "Founder & Medical Director",
      license: "PRC Lic. #0089201",
      icon: Stethoscope,
      bg: "hover:bg-blue-50/80 hover:border-blue-300",
      badgeBg: "bg-blue-100 text-blue-800",
    },
    {
      name: "Nurse Angelmae Palma, RN",
      username: "nurse.palma",
      role: "Nurse",
      title: "Head Nurse • Triage Officer",
      license: "PRC Lic. #0093820",
      icon: Syringe,
      bg: "hover:bg-teal-50/80 hover:border-teal-300",
      badgeBg: "bg-teal-100 text-teal-800",
    },
    {
      name: "Glenda Llarvez",
      username: "staff.glenda",
      role: "Staff",
      title: "Front Desk & Admissions",
      license: "EMP-REC-005",
      icon: ClipboardList,
      bg: "hover:bg-emerald-50/80 hover:border-emerald-300",
      badgeBg: "bg-emerald-100 text-emerald-800",
    },
    {
      name: "JP Valebia",
      username: "admin.jp",
      role: "Admin",
      title: "Hospital Administrator",
      license: "HA-PRC #1002",
      icon: ShieldCheck,
      bg: "hover:bg-amber-50/80 hover:border-amber-300",
      badgeBg: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Hospital Brand & Close Button */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 flex items-center justify-between relative border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <img
              src="/carepoint-logo.png"
              alt="CarePoint Medical Center"
              className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-md shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <div className="font-serif font-bold text-base text-white leading-tight flex items-center gap-2">
                <span>CarePoint Medical Center</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-full font-mono font-medium">
                  SECURE PORTAL
                </span>
              </div>
              <div className="text-[11px] text-teal-300/90 tracking-wide font-medium">
                Hospital Information System (HIS) • Clinician Sign In
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Sign In Prompt / Instructions */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Lock size={14} className="text-teal-600" />
              <span>Practitioner & Staff Authentication</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              Login Only
            </span>
          </div>

          {signInError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{signInError}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignInSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username / Clinician ID
              </label>
              <input
                type="text"
                required
                value={signInUsername}
                onChange={(e) => setSignInUsername(e.target.value)}
                placeholder="e.g. dr.jacobe, nurse.palma, admin.jp"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-hidden transition-all bg-white font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password / Credential
                </label>
                <span className="text-[11px] text-slate-400">
                  (Demo: any password or "pass")
                </span>
              </div>
              <input
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="Enter security key"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-hidden transition-all bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              <LogIn size={15} strokeWidth={2} />
              <span>{isLoading ? "Authenticating..." : "Authenticate Session"}</span>
            </button>
          </form>

          {/* 1-Click Demo Logins for Quick Role Testing */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1-Click Quick Role Switch (Demo)
              </span>
              <span className="text-[10px] text-teal-700 font-medium">
                Click profile to sign in
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickStaffProfiles.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.username}
                    type="button"
                    onClick={() => handleQuickLogin(p.username)}
                    className={`p-2.5 rounded-xl border border-slate-200 text-left transition-all cursor-pointer flex items-center gap-2.5 bg-slate-50/60 ${p.bg}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon size={16} className="text-teal-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {p.name}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${p.badgeBg} shrink-0`}>
                          {p.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {p.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Policy Note on Staff Provisioning */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] leading-relaxed flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Staff Account Provisioning Policy:</strong> Public registration is disabled. Practitioner and clinical staff accounts are provisioned exclusively by the CarePoint Hospital IT Systems Administrator in accordance with RA 10173 (Philippine Data Privacy Act). Contact local IT Ext. 4012 for credential provisioning.
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          CarePoint Medical Center HIS • Protected by Hospital-Grade RBAC & Audit Trails
        </div>
      </div>
    </div>
  );
}
