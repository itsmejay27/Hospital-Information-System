import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Patient, Role } from "../types";
import { DEMO_USERS } from "../mockData";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import {
  Search,
  PhoneCall,
  Clock,
  Stethoscope,
  Syringe,
  ClipboardList,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  LogOut,
  X,
  Building2,
} from "./Icons";

interface OpdTopNavProps {
  currentUser?: User | null;
  onSwitchUser?: (user: User) => void;
  onSignOut?: () => void;
  patients?: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  selectedPatient?: Patient | null;
  emergencyHotline?: string;
}

export default function OpdTopNav({
  currentUser: propsUser,
  onSwitchUser: propsSwitchUser,
  onSignOut: propsSignOut,
  patients: propsPatients,
  onSelectPatient: propsSelectPatient,
  selectedPatient: propsSelectedPatient,
  emergencyHotline = "911",
}: OpdTopNavProps) {
  const navigate = useNavigate();
  const { user: authUser, switchUser: authSwitchUser, logout: authLogout } = useAuth();
  const {
    patients: contextPatients,
    selectedPatient: contextSelectedPatient,
    setSelectedPatient: contextSetSelectedPatient,
    setGlobalSearchQuery,
  } = useOpdData();

  const user = propsUser !== undefined ? propsUser : authUser;
  const patients = propsPatients || contextPatients;
  const activePatient = propsSelectedPatient !== undefined ? propsSelectedPatient : contextSelectedPatient;

  const [timeString, setTimeString] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  // Live real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const date = now.toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      setTimeString(`${time} • ${date}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered patients for global search
  const searchResults = searchQuery.trim()
    ? patients.filter(
      p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.philhealth?.pin && p.philhealth.pin.includes(searchQuery))
    )
    : [];

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setGlobalSearchQuery(val);
    setIsSearchOpen(true);
  };

  const handlePatientSelect = (p: Patient) => {
    if (propsSelectPatient) {
      propsSelectPatient(p);
    } else {
      contextSetSelectedPatient(p);
    }
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate("/workbench");
  };

  const handleSwitchSession = (targetUser: User) => {
    if (propsSwitchUser) {
      propsSwitchUser(targetUser);
    } else {
      authSwitchUser(targetUser);
    }
    setIsRoleMenuOpen(false);
  };

  const handleLogoutSession = () => {
    if (propsSignOut) {
      propsSignOut();
    } else {
      authLogout();
    }
    setIsRoleMenuOpen(false);
    navigate("/login");
  };

  const accounts = Object.values(DEMO_USERS).map(u => u.user);

  const getRoleIcon = (role: Role, size = 15) => {
    switch (role) {
      case "doctor":
        return <Stethoscope size={size} strokeWidth={2} className="text-blue-500" />;
      case "nurse":
        return <Syringe size={size} strokeWidth={2} className="text-purple-500" />;
      case "staff":
        return <ClipboardList size={size} strokeWidth={2} className="text-emerald-500" />;
      case "admin":
        return <ShieldCheck size={size} strokeWidth={2} className="text-amber-500" />;
      default:
        return <UserIcon size={size} strokeWidth={2} className="text-slate-500" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0 select-none shadow-2xs">
      {/* Left Area: Emergency Hotline & Selected Patient Badge */}
      <div className="flex items-center gap-3">
        {/* Emergency Hotline Pill */}
        <a
          href={`tel:${emergencyHotline}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors shadow-2xs group cursor-pointer"
          title="Emergency Medical Hotline"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          <PhoneCall size={13} strokeWidth={2} className="text-rose-600 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] uppercase tracking-wider font-bold">EMERGENCY: {emergencyHotline}</span>
        </a>

        {/* Public Site Link */}
        <button
          onClick={() => navigate("/")}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          title="View Public Hospital Information"
        >
          <Building2 size={13} strokeWidth={2} className="text-slate-600" />
          <span className="text-[11px] font-medium">Public Site</span>
        </button>

        {/* Currently Active Patient Context Pill (Clinical Roles Only) */}
        {activePatient && user?.role !== "admin" ? (
          <div
            onClick={() => navigate("/workbench")}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-xs cursor-pointer hover:bg-teal-100/70 transition-colors"
            title="Click to view Active Patient in Doctor Workbench"
          >
            <span className="text-teal-700 font-medium">Active Patient:</span>
            <span className="font-semibold text-slate-800">{activePatient.name}</span>
            <span className="text-[10px] font-mono text-teal-700 bg-teal-100 px-1 rounded font-semibold">
              {activePatient.id}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${activePatient.triageTier === "critical"
                  ? "bg-rose-100 text-rose-700 border border-rose-300"
                  : activePatient.triageTier === "observation"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
            >
              {activePatient.triageTier}
            </span>
          </div>
        ) : null}
      </div>

      {/* Middle Area: Global Search (Restricted for Admin) */}
      <div className="relative flex-1 max-w-md hidden md:block">
        {user?.role === "admin" ? (
          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-xs flex items-center justify-between font-mono">
            <span>System Console Mode (Zero PHI Access)</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">ADMIN</span>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search
                size={16}
                strokeWidth={2}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search patient by name, MRN (P-2024-xxx), or PhilHealth PIN..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setGlobalSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Found {searchResults.length} Patient{searchResults.length !== 1 ? "s" : ""}
                </div>
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500 text-center italic">
                    No matching patient record found for "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePatientSelect(p)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">{p.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {p.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.age}y/o • {p.gender} • Chief Complaint: {p.chiefComplaint}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.triageTier === "critical"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : p.triageTier === "observation"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                      >
                        {p.triageTier}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Area: Real-Time Clock & Dynamic Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
          <Clock size={13} strokeWidth={2} className="text-slate-400" />
          <span>{timeString}</span>
        </div>

        {/* Quick Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs transition-all shadow-2xs cursor-pointer"
          >
            {user && getRoleIcon(user.role, 16)}
            <div className="text-left leading-tight hidden sm:block">
              <div className="font-semibold text-slate-800 truncate max-w-[140px]">
                {user?.name || "Active Session"}
              </div>
              <div className="text-[10px] text-teal-700 font-bold uppercase">
                {user?.role} {user?.licenseNumber && `• ${user.licenseNumber}`}
              </div>
            </div>
            <ChevronDown size={14} strokeWidth={2} className="text-slate-400 ml-0.5" />
          </button>

          {/* Role Dropdown Menu */}
          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 divide-y divide-slate-100">
              <div className="px-3.5 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Clinician
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a clinical session with official PRC license credentials:
                </p>
              </div>

              <div className="py-1">
                {accounts.map(acc => {
                  const isSelected = user?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleSwitchSession(acc)}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer ${isSelected ? "bg-teal-50/70 border-l-4 border-teal-600" : ""
                        }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {getRoleIcon(acc.role, 16)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {acc.title}
                        </div>
                        {acc.licenseNumber && (
                          <div className="text-[10px] font-mono text-teal-700 font-medium">
                            {acc.licenseNumber}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-2 py-1.5">
                <button
                  onClick={handleLogoutSession}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  <LogOut size={14} strokeWidth={2} />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
