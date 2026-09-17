import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DEMO_USERS } from "../mockData";
import { User, Role } from "../types";
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
  ArrowRight,
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

  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialTab);

  // Sign In form state
  const [signInUsername, setSignInUsername] = useState("dr.jacobe");
  const [signInPassword, setSignInPassword] = useState("pass");
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpRole, setSignUpRole] = useState<Role>("doctor");
  const [signUpTitle, setSignUpTitle] = useState("Attending Physician");
  const [signUpDept, setSignUpDept] = useState("Outpatient Department");
  const [signUpLicense, setSignUpLicense] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    const success = login(signInUsername, signInPassword);
    if (success) {
      onClose();
      navigate("/dashboard");
    } else {
      setSignInError("Invalid credentials. Please select one of the authorized demo profiles or verify your username.");
    }
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

    if (!signUpName.trim()) {
      setSignUpError("Please enter your full legal name.");
      return;
    }
    if (!signUpUsername.trim()) {
      setSignUpError("Please enter a valid username.");
      return;
    }
    if (signUpPassword && signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Passwords do not match.");
      return;
    }

    const initials = signUpName
      .split(" ")
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CP";

    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: signUpName.trim(),
      username: signUpUsername.trim().toLowerCase(),
      role: signUpRole,
      title: signUpTitle || "Medical Staff",
      department: signUpDept || "Outpatient Services",
      avatarInitials: initials,
      licenseNumber: signUpLicense.trim() || `PRC Lic. #00${Math.floor(10000 + Math.random() * 90000)}`,
      status: "active",
      contactEmail: `${signUpUsername.trim().toLowerCase()}@carepointmedical.ph`,
    };

    // Save to active session
    switchUser(newUser);
    setSignUpSuccess("Account verified and registered! Loading clinical dashboard...");

    setTimeout(() => {
      onClose();
      navigate("/dashboard");
    }, 1200);
  };

  const quickStaffProfiles = [
    {
      name: "Dr. Mark Arkiel Jacobe",
      username: "dr.jacobe",
      role: "doctor" as const,
      title: "Founder & Medical Director",
      license: "PRC Lic. #0089201",
      icon: Stethoscope,
      bg: "hover:bg-blue-50 hover:border-blue-300",
      pill: "bg-blue-100 text-blue-800",
    },
    {
      name: "Nurse Angelmae Palma, RN",
      username: "nurse.palma",
      role: "nurse" as const,
      title: "Head Nurse",
      license: "PRC Lic. #0093820",
      icon: Syringe,
      bg: "hover:bg-teal-50 hover:border-teal-300",
      pill: "bg-teal-100 text-teal-800",
    },
    {
      name: "Glenda Llarvez",
      username: "staff.glenda",
      role: "staff" as const,
      title: "Front Desk Receptionist",
      license: "EMP-REC-005",
      icon: ClipboardList,
      bg: "hover:bg-emerald-50 hover:border-emerald-300",
      pill: "bg-emerald-100 text-emerald-800",
    },
    {
      name: "JP Valebia",
      username: "admin.jp",
      role: "admin" as const,
      title: "Hospital Administrator",
      license: "HA-PRC #1002",
      icon: ShieldCheck,
      bg: "hover:bg-amber-50 hover:border-amber-300",
      pill: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Hospital Brand & Close Button */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 flex items-center justify-between relative border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <img
              src="/carepoint-logo.png"
              alt="CarePoint Medical Center"
              className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-md shrink-0"
              onError={(e) => {
                // Fallback icon if logo image fails
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <div className="font-serif font-bold text-base text-white leading-tight">
                CarePoint Medical Center
              </div>
              <div className="text-[11px] text-teal-300 tracking-wide font-medium">
                Hospital Information System (HIS) • Access Portal
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
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("signin");
              setSignInError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === "signin"
                ? "bg-white text-teal-700 border-teal-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <LogIn size={15} strokeWidth={2} />
            <span>Staff Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setSignUpError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === "signup"
                ? "bg-white text-teal-700 border-teal-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <UserPlus size={15} strokeWidth={2} />
            <span>Create Practitioner Account</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: SIGN IN */}
          {activeTab === "signin" && (
            <div className="space-y-4">
              {signInError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{signInError}</span>
                </div>
              )}

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
                    placeholder="e.g. dr.jacobe or nurse.palma"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-hidden transition-all bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter security credential"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-hidden transition-all bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogIn size={15} strokeWidth={2} />
                  <span>Authenticate Session</span>
                </button>
              </form>

              {/* Quick 1-Click Demo Logins */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Quick Staff Demo Access
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickStaffProfiles.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.username}
                        type="button"
                        onClick={() => handleQuickLogin(p.username)}
                        className={`p-2.5 rounded-xl border border-slate-200 text-left transition-all cursor-pointer flex items-center gap-2.5 bg-slate-50/70 ${p.bg}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                          <Icon size={16} className="text-teal-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {p.name}
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

          {/* TAB 2: SIGN UP */}
          {activeTab === "signup" && (
            <div className="space-y-4">
              {signUpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{signUpError}</span>
                </div>
              )}

              {signUpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 font-medium">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{signUpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSignUpSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Maria Elena Cruz, MD"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      System Role *
                    </label>
                    <select
                      value={signUpRole}
                      onChange={(e) => {
                        const newRole = e.target.value as Role;
                        setSignUpRole(newRole);
                        if (newRole === "doctor") {
                          setSignUpTitle("Attending Physician");
                          setSignUpDept("Outpatient Department");
                        } else if (newRole === "nurse") {
                          setSignUpTitle("Staff Nurse, RN");
                          setSignUpDept("Nursing Station");
                        } else if (newRole === "staff") {
                          setSignUpTitle("Admissions Officer");
                          setSignUpDept("Front Desk & Registration");
                        } else {
                          setSignUpTitle("Hospital Administrator");
                          setSignUpDept("Administration");
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden bg-white font-medium"
                    >
                      <option value="doctor">Doctor / Physician</option>
                      <option value="nurse">Nurse / Triage Officer</option>
                      <option value="staff">Admissions / Clinic Staff</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={signUpTitle}
                      onChange={(e) => setSignUpTitle(e.target.value)}
                      placeholder="e.g. Attending Cardiologist"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={signUpDept}
                      onChange={(e) => setSignUpDept(e.target.value)}
                      placeholder="e.g. Internal Medicine"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PRC License / Employee ID
                    </label>
                    <input
                      type="text"
                      value={signUpLicense}
                      onChange={(e) => setSignUpLicense(e.target.value)}
                      placeholder="PRC Lic. #0099881"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Desired Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      placeholder="e.g. dr.cruz"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <UserPlus size={15} strokeWidth={2} />
                  <span>Register & Open Dashboard</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          CarePoint Medical Center HIS • Secured with strict Role-Based Access Control
        </div>
      </div>
    </div>
  );
}
