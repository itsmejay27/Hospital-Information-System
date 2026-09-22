import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { Role, User } from "../types";
import {
  X,
  LogIn,
  UserPlus,
  Stethoscope,
  Syringe,
  ClipboardList,
  ShieldCheck,
  AlertCircle,
  Check,
  Lock,
  Building2,
} from "./Icons";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = "signin",
}: AuthModalProps) {
  const navigate = useNavigate();
  const { login, switchUser } = useAuth();
  const { addUser } = useOpdData();

  // Active tab state
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialTab);

  // Sign In form state
  const [signInUsername, setSignInUsername] = useState("dr.jacobe");
  const [signInPassword, setSignInPassword] = useState("pass");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sign Up form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpRole, setSignUpRole] = useState<Role>("doctor");
  const [signUpTitle, setSignUpTitle] = useState("Attending Physician");
  const [signUpDepartment, setSignUpDepartment] = useState("Outpatient Department");
  const [signUpLicense, setSignUpLicense] = useState("PRC Lic. #0098412");
  const [signUpPassword, setSignUpPassword] = useState("pass");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("pass");
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

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
          "Invalid credentials. Please select one of the authorized staff demo profiles below or verify your clinician username."
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

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (!signUpName.trim() || !signUpUsername.trim()) {
      setSignUpError("Please fill out all required fields.");
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Passwords do not match. Please verify.");
      return;
    }

    setIsLoading(true);

    const initials = signUpName
      .trim()
      .split(" ")
      .filter(p => !p.startsWith("Dr.") && !p.startsWith("Nurse"))
      .map(p => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CP";

    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: signUpName.trim(),
      username: signUpUsername.trim().toLowerCase(),
      role: signUpRole,
      title: signUpTitle.trim() || (signUpRole === "doctor" ? "Attending Physician" : "Clinical Staff"),
      department: signUpDepartment.trim() || "Outpatient Department",
      avatarInitials: initials,
      licenseNumber: signUpLicense.trim() || undefined,
      credentials: signUpRole === "doctor" ? "MD" : signUpRole === "nurse" ? "RN" : undefined,
      status: "active",
      contactEmail: `${signUpUsername.trim().toLowerCase()}@carepointmedical.ph`,
      contactPhone: "+63 (2) 8920-5000",
    };

    setTimeout(() => {
      addUser(newUser, signUpPassword);
      switchUser(newUser);
      setIsLoading(false);
      setSignUpSuccess(true);

      setTimeout(() => {
        setSignUpSuccess(false);
        onClose();
        navigate("/dashboard");
      }, 1000);
    }, 300);
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
                Hospital Information System (HIS) • Clinician Portal
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

        {/* Tab Switching Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "signin"
                ? "border-teal-600 text-teal-700 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "signup"
                ? "border-teal-600 text-teal-700 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserPlus size={14} />
            <span>Sign Up / Staff Registration</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* ============================================================ */}
          {/* TAB 1: SIGN IN */}
          {/* ============================================================ */}
          {activeTab === "signin" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Lock size={14} className="text-teal-600" />
                  <span>Authorized Clinician Authentication</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  Active Gateway
                </span>
              </div>

              {signInError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{signInError}</div>
                </div>
              )}

              {/* Sign In Form */}
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
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SIGN UP / STAFF REGISTRATION */}
          {/* ============================================================ */}
          {activeTab === "signup" && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-800 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Building2 size={15} className="text-teal-700" />
                  <span>Clinical & Hospital Staff Registration</span>
                </div>
                Create an authorized hospital practitioner account. Upon completion, you will be authenticated and redirected to your specialized workspace.
              </div>

              {signUpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{signUpError}</div>
                </div>
              )}

              {signUpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span className="font-bold">Account created successfully! Redirecting to OPD Dashboard...</span>
                </div>
              )}

              <form onSubmit={handleSignUpSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Dr. Maria Elena Santos, MD"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Username / Login ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      placeholder="e.g. dr.santos"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Professional Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={signUpRole}
                      onChange={(e) => {
                        const newRole = e.target.value as Role;
                        setSignUpRole(newRole);
                        if (newRole === "doctor") {
                          setSignUpTitle("Attending Physician");
                          setSignUpDepartment("Outpatient Department");
                        } else if (newRole === "nurse") {
                          setSignUpTitle("Staff Nurse, RN");
                          setSignUpDepartment("Nursing Station & MAR");
                        } else if (newRole === "staff") {
                          setSignUpTitle("Admissions Officer");
                          setSignUpDepartment("Admissions & Front Desk");
                        } else {
                          setSignUpTitle("Hospital Administrator");
                          setSignUpDepartment("Hospital Administration");
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-semibold text-slate-800"
                    >
                      <option value="doctor">Doctor / Attending Physician</option>
                      <option value="nurse">Nurse / Triage Clinician</option>
                      <option value="staff">Staff / Admissions Officer</option>
                      <option value="admin">Admin / Security Auditor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Position / Title
                    </label>
                    <input
                      type="text"
                      value={signUpTitle}
                      onChange={(e) => setSignUpTitle(e.target.value)}
                      placeholder="e.g. Clinical Specialist"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={signUpDepartment}
                      onChange={(e) => setSignUpDepartment(e.target.value)}
                      placeholder="e.g. Internal Medicine"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PRC License Number / Hospital Employee ID
                  </label>
                  <input
                    type="text"
                    value={signUpLicense}
                    onChange={(e) => setSignUpLicense(e.target.value)}
                    placeholder="e.g. PRC Lic. #0089201"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Create security password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Confirm security password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-60"
                >
                  <UserPlus size={15} strokeWidth={2} />
                  <span>{isLoading ? "Creating Staff Account..." : "Register & Authenticate"}</span>
                </button>
              </form>
            </div>
          )}

          {/* Policy Note on Staff Provisioning */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] leading-relaxed flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Security & Privacy Notice:</strong> All hospital staff actions, clinical consults, and access logs are recorded with cryptographic SHA-256 validation in compliance with Philippine Republic Act No. 10173 (Data Privacy Act of 2012).
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          CarePoint Medical Center HIS • Role-Based Access Control (RBAC) Enforced
        </div>
      </div>
    </div>
  );
}
