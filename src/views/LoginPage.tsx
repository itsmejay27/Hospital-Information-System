import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { DEMO_USERS } from "../mockData";
import {
  Stethoscope,
  Syringe,
  ClipboardList,
  ShieldCheck,
  PhoneCall,
  LogIn,
  AlertCircle,
} from "../components/Icons";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("dr.reyes");
  const [password, setPassword] = useState("pass");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setErrorMsg("Invalid staff credentials. Please check your username or select a quick login below.");
    }
  };

  const handleQuickLogin = (uname: string) => {
    const success = login(uname, "pass");
    if (!success) {
      setErrorMsg(`Could not log in as ${uname}`);
    }
  };

  const staffProfiles = [
    {
      name: "Dr. Jose Reyes, MD",
      username: "dr.reyes",
      role: "Doctor",
      license: "PRC Lic. #0084721",
      dept: "Internal Medicine & OPD",
      icon: Stethoscope,
      color: "bg-blue-600",
    },
    {
      name: "Angel Mae, RN",
      username: "nurse.angel",
      role: "Nurse",
      license: "PRC Lic. #0093820",
      dept: "Emergency & Medical Surgical Ward",
      icon: Syringe,
      color: "bg-purple-600",
    },
    {
      name: "Jendy Perez",
      username: "staff.jendy",
      role: "Staff",
      license: "EMP-ADM-101",
      dept: "Outpatient Registration & Cashier",
      icon: ClipboardList,
      color: "bg-emerald-600",
    },
    {
      name: "Atty. Roberto Ramos",
      username: "admin.ramos",
      role: "Admin",
      license: "IBP Roll #54219",
      dept: "Administration & Data Privacy",
      icon: ShieldCheck,
      color: "bg-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between select-none">
      {/* Top Banner */}
      <div className="bg-rose-600 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 text-center">
        <PhoneCall size={14} strokeWidth={2} />
        <span>CityCare General Hospital Emergency Medical Command: <strong>911</strong></span>
        <span className="opacity-60 hidden sm:inline">|</span>
        <span className="opacity-90 hidden sm:inline">24/7 Outpatient & Trauma Operations</span>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
          {/* Hospital Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-600/20 border border-teal-500/40 text-teal-400 font-bold text-xl flex items-center justify-center mx-auto shadow-inner">
              CC
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              CityCare General Hospital
            </h1>
            <p className="text-xs text-teal-400 font-medium uppercase tracking-wider">
              Outpatient Department (OPD) System
            </p>
            <p className="text-[11px] text-slate-400">
              Please authenticate your medical staff session to access patient health records.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} strokeWidth={2} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Staff Username / Employee ID
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. dr.reyes"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <LogIn size={15} strokeWidth={2} />
              <span>Sign In to Clinical Workspace</span>
            </button>
          </form>

          {/* 1-Click Fast Staff Quick Login Roster */}
          <div className="border-t border-slate-800 pt-4 space-y-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">
              Quick Role Authentication (Instant Session)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {staffProfiles.map(staff => {
                const Icon = staff.icon;
                return (
                  <button
                    key={staff.username}
                    onClick={() => handleQuickLogin(staff.username)}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/50 text-left transition-all group flex items-start gap-2.5 cursor-pointer"
                  >
                    <div className={`w-7 h-7 rounded-lg ${staff.color} text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                      <Icon size={14} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-xs truncate group-hover:text-teal-300 transition-colors">
                        {staff.name}
                      </div>
                      <div className="text-[10px] text-teal-400 font-mono">
                        {staff.license}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {staff.role} • {staff.dept}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-center text-slate-500 leading-tight">
            Republic Act 10173 (Data Privacy Act of 2012) compliant. Unauthorized access to hospital records is strictly prohibited and logged.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-500 border-t border-slate-800/80">
        CityCare General Hospital Information System (HIS) • Level 3 Tertiary Teaching Hospital
      </footer>
    </div>
  );
}
