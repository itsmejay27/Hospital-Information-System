import React from "react";
import { Patient, OpdQueueItem, OpdTab, User, TriageTier } from "../types";
import {
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Stethoscope,
  UserPlus,
  CreditCard,
  Send,
  ChevronRight,
  TrendingUp,
} from "../components/Icons";

interface OpdDashboardViewProps {
  queue: OpdQueueItem[];
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onNavigateTab: (tab: OpdTab) => void;
  onCallNextPatient: () => void;
  currentUser: User | null;
}

export default function OpdDashboardView({
  queue,
  patients,
  onSelectPatient,
  onNavigateTab,
  onCallNextPatient,
  currentUser,
}: OpdDashboardViewProps) {
  // Statistics calculations
  const totalInQueue = queue.length;
  const waitingCount = queue.filter(q => q.status === "Waiting").length;
  const inConsultCount = queue.filter(q => q.status === "In-Consultation").length;
  const completedTodayCount = 18; // Census metric
  const criticalCount = queue.filter(q => q.triageTier === "critical").length;
  const observationCount = queue.filter(q => q.triageTier === "observation").length;
  const stableCount = queue.filter(q => q.triageTier === "stable").length;

  const nextWaiting = queue.find(q => q.status === "Waiting");

  return (
    <div className="space-y-5">
      {/* Welcome & Call Next Patient Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Live OPD Operations • Session Active
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Good day, {currentUser?.name || "Doctor"}!
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Outpatient Department clinic queue is active. You have{" "}
              <span className="text-teal-300 font-semibold">{waitingCount} patient{waitingCount !== 1 ? "s" : ""}</span> currently waiting in the lounge, with{" "}
              <span className="text-rose-400 font-semibold">{criticalCount} critical</span> triage alert.
            </p>
          </div>

          {/* Call Next Patient Quick Action Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {nextWaiting ? (
              <div>
                <div className="text-[11px] text-teal-200 font-medium uppercase tracking-wide">
                  Next in Queue: #{nextWaiting.queueNumber}
                </div>
                <div className="text-sm font-bold text-white">
                  {nextWaiting.patientName} ({nextWaiting.age}y/o)
                </div>
                <div className="text-[11px] text-slate-300 truncate max-w-[200px]">
                  {nextWaiting.chiefComplaint}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-300 italic">
                All waiting patients attended!
              </div>
            )}

            <button
              onClick={onCallNextPatient}
              disabled={!nextWaiting}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0 ${
                nextWaiting
                  ? "bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer hover:scale-105"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Users size={15} strokeWidth={2.5} />
              <span>Call Next Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Vital OPD Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Queue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Queue Waiting
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{waitingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{inConsultCount} In-Consultation</span>
          </div>
        </div>

        {/* Critical Red Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
              Critical Triage
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{criticalCount}</div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">
            Immediate physician consult needed
          </div>
        </div>

        {/* Observation Yellow */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
              Watch / Observation
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Activity size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{observationCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Bedside vitals monitoring active
          </div>
        </div>

        {/* Completed Consultations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Daily OPD Census
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{completedTodayCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp size={12} strokeWidth={2} />
            <span>94% Target clearance rate</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Live Queue Snapshot & Priority Watch System */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Patient Queue Table Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Live Clinic Patient Queue
              </h3>
              <p className="text-xs text-slate-500">Real-time outpatient consultation order</p>
            </div>
            <button
              onClick={() => onNavigateTab("queue")}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Open Full Queue</span>
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Triage Tier</th>
                  <th className="py-2.5 px-3">Chief Complaint</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map(item => {
                  const pat = patients.find(p => p.id === item.patientId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-700">
                        #{item.queueNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{item.patientName}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.age}y/o • {item.gender} • In: {item.checkInTime}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.triageTier === "critical"
                              ? "bg-rose-100 text-rose-700 border border-rose-300"
                              : item.triageTier === "observation"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          {item.triageTier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate">
                        {item.chiefComplaint}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === "In-Consultation"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            if (pat) onSelectPatient(pat);
                            onNavigateTab("workbench");
                          }}
                          className="px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Stethoscope size={12} strokeWidth={2} />
                          <span>Consult</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Priority Watch System & Quick Clinical Links */}
        <div className="space-y-4">
          {/* Priority Watch System (3 Tiers) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Priority Watch System
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                MTS Protocol
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Critical Tier */}
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1 shrink-0"></span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-900">RED: Critical Care</span>
                    <span className="text-xs font-mono font-bold text-rose-700">{criticalCount} Active</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Acute chest pain, severe dyspnea, shock, altered mental state.
                  </p>
                </div>
              </div>

              {/* Watch / Observation Tier */}
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-900">YELLOW: Observation</span>
                    <span className="text-xs font-mono font-bold text-amber-700">{observationCount} Active</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Severe pain, persistent fever &gt;38.5°C, post-op dressings.
                  </p>
                </div>
              </div>

              {/* Stable Tier */}
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-900">GREEN: Stable OPD</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">{stableCount} Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Routine chronic refills, minor complaints, follow-up clearances.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick OPD Modules Shortcuts */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Frequent OPD Actions
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab("registration")}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all"
              >
                <UserPlus size={16} strokeWidth={2} className="text-teal-700 mb-1" />
                <span className="font-semibold text-[11px]">New Patient</span>
              </button>

              <button
                onClick={() => onNavigateTab("philhealth")}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all"
              >
                <CreditCard size={16} strokeWidth={2} className="text-teal-700 mb-1" />
                <span className="font-semibold text-[11px]">eClaims & Bill</span>
              </button>

              <button
                onClick={() => onNavigateTab("vitals")}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all"
              >
                <Activity size={16} strokeWidth={2} className="text-teal-700 mb-1" />
                <span className="font-semibold text-[11px]">Vitals & BMI</span>
              </button>

              <button
                onClick={() => onNavigateTab("referrals")}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all"
              >
                <Send size={16} strokeWidth={2} className="text-teal-700 mb-1" />
                <span className="font-semibold text-[11px]">Refer & Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
