import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OpdQueueItem, QueueStatus, Patient, TriageTier } from "../types";
import { useOpdData } from "../context/OpdDataContext";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Search,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Activity,
  ArrowRight,
  ChevronRight,
  Filter,
  Bed,
  UserPlus,
} from "../components/Icons";

interface OpdQueueViewProps {
  queue?: OpdQueueItem[];
  onUpdateQueue?: (updated: OpdQueueItem[]) => void;
  patients?: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  onNavigateToWorkbench?: () => void;
}

export default function OpdQueueView({
  queue: propsQueue,
  onUpdateQueue: propsUpdateQueue,
  patients: propsPatients,
  onSelectPatient: propsSelectPatient,
  onNavigateToWorkbench: propsNavigateToWorkbench,
}: OpdQueueViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const {
    queue: contextQueue,
    patients: contextPatients,
    setSelectedPatient: contextSetSelectedPatient,
    callNextPatient,
    updateQueueStatus,
    globalSearchQuery,
    waitingCount,
    criticalCount,
    inConsultCount,
    completedCount,
  } = useOpdData();

  const queue = propsQueue || contextQueue;
  const patients = propsPatients || contextPatients;

  const [searchTerm, setSearchTerm] = useState(globalSearchQuery || "");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [triageFilter, setTriageFilter] = useState<string>("All");

  React.useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchTerm(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const filteredQueue = queue.filter(item => {
    const activeSearch = (searchTerm || globalSearchQuery || "").toLowerCase().trim();
    const patientObj = patients.find(p => p.id === item.patientId);
    const pin = patientObj?.philhealth?.pin || "";

    const matchesSearch =
      !activeSearch ||
      item.patientName.toLowerCase().includes(activeSearch) ||
      item.patientId.toLowerCase().includes(activeSearch) ||
      pin.toLowerCase().includes(activeSearch) ||
      item.chiefComplaint.toLowerCase().includes(activeSearch) ||
      (item.roomOrBooth && item.roomOrBooth.toLowerCase().includes(activeSearch));

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesTriage = triageFilter === "All" || item.triageTier === triageFilter;

    return matchesSearch && matchesStatus && matchesTriage;
  });

  const handleStatusChange = (id: string, newStatus: QueueStatus) => {
    if (propsUpdateQueue) {
      const updated = queue.map(q => (q.id === id ? { ...q, status: newStatus } : q));
      propsUpdateQueue(updated);
    } else {
      updateQueueStatus(id, newStatus);
    }
  };

  const handleCallNext = () => {
    if (propsUpdateQueue && propsNavigateToWorkbench) {
      const nextIdx = queue.findIndex(q => q.status === "Waiting");
      if (nextIdx !== -1) {
        const updated = [...queue];
        updated[nextIdx] = {
          ...updated[nextIdx],
          status: "In-Consultation",
          roomOrBooth: "Consultation Room 1",
        };
        propsUpdateQueue(updated);

        const patient = patients.find(p => p.id === updated[nextIdx].patientId);
        if (patient && propsSelectPatient) {
          propsSelectPatient(patient);
        }
        propsNavigateToWorkbench();
      }
    } else {
      const called = callNextPatient();
      if (called) {
        navigate("/clinical/doctor-workbench");
      }
    }
  };

  const handleStartConsult = (item: OpdQueueItem) => {
    handleStatusChange(item.id, "In-Consultation");
    const patient = patients.find(p => p.id === item.patientId);
    if (patient) {
      if (propsSelectPatient) {
        propsSelectPatient(patient);
      } else {
        contextSetSelectedPatient(patient);
      }
    }
    if (propsNavigateToWorkbench) {
      propsNavigateToWorkbench();
    } else {
      navigate("/clinical/doctor-workbench");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Hero Banner (Medzone Hospital Theme) */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Patient Live Outpatient Queue</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time waiting room arrivals, clinic booth assignments, Manchester Triage telemetry, and physician consultations.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isDoctor ? (
            <>
              <button
                onClick={handleCallNext}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <UserCheck size={16} strokeWidth={2.5} />
                <span>Call Next Waiting Patient</span>
              </button>

              <button
                onClick={() => navigate("/clinical?tab=workbench")}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Stethoscope size={15} />
                <span>Doctor Workbench</span>
              </button>
            </>
          ) : user?.role === "nurse" ? (
            <>
              <button
                onClick={() => navigate("/clinical?tab=vitals")}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Activity size={16} strokeWidth={2.5} />
                <span>Triage & Vitals Entry</span>
              </button>

              <button
                onClick={() => navigate("/registration/beds")}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Bed size={15} />
                <span>Ward Bed Telemetry</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/registration/new-patient")}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <UserPlus size={16} strokeWidth={2.5} />
                <span>Register New Patient</span>
              </button>

              <button
                onClick={() => navigate("/registration/directory")}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Users size={15} />
                <span>Master Directory</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Stat Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Waiting Patients</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{waitingCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Waiting for consultation</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm shadow-inner">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">In Consultation</span>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1">{inConsultCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Inside doctor booths</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-inner">
            <Stethoscope size={22} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Critical (Tier 1)</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">{criticalCount}</div>
            <span className="text-[10px] text-rose-500 mt-0.5 block font-semibold">Immediate attention</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold text-sm shadow-inner">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Completed Encounters</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{completedCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Today's finished visits</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shadow-inner">
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Main Queue Card with Pill Filters & Table */}
      <div className="bg-white rounded-3xl border border-slate-100/90 shadow-xs overflow-hidden">
        {/* Filters Header Bar */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative w-full lg:w-96">
              <Search
                size={16}
                strokeWidth={2}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search patient name, MRN, complaint, clinic room..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-full border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden shadow-2xs"
              />
            </div>

            {/* Pill Triage Filter */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Triage:</span>
              {[
                { id: "All", label: "All" },
                { id: "critical", label: "Critical" },
                { id: "observation", label: "Observation" },
                { id: "stable", label: "Stable" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTriageFilter(t.id)}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    triageFilter === t.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Pill Status Filter */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
              {["All", "Waiting", "In-Consultation", "Completed"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    statusFilter === s
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modern Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 text-center w-14">#</th>
                <th className="py-3 px-3">Patient</th>
                <th className="py-3 px-3">Age / Sex</th>
                <th className="py-3 px-3">Arrival</th>
                <th className="py-3 px-3">Triage Priority</th>
                <th className="py-3 px-3">Chief Complaint</th>
                <th className="py-3 px-3">Clinic Location</th>
                <th className="py-3 px-3">Queue State</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    No patients currently matching the selected queue filters.
                  </td>
                </tr>
              ) : (
                filteredQueue.map(item => (
                  <tr
                    key={item.id}
                    className={`hover:bg-emerald-50/30 transition-colors ${
                      item.status === "In-Consultation" ? "bg-emerald-50/20" : ""
                    }`}
                  >
                    {/* Circular Queue Number */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold shadow-2xs">
                        #{item.queueNumber}
                      </span>
                    </td>

                    {/* Patient Details */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-xs leading-tight whitespace-nowrap">
                        {item.patientName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{item.patientId}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      {item.age} / {item.gender}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">{item.checkInTime}</td>

                    {/* Triage Tier */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.triageTier === "critical"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : item.triageTier === "observation"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.triageTier === "critical"
                              ? "bg-rose-500 animate-ping"
                              : item.triageTier === "observation"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        ></span>
                        {item.triageTier}
                      </span>
                    </td>

                    {/* Chief Complaint */}
                    <td className="py-3 px-3 text-slate-800 font-medium max-w-[180px] truncate" title={item.chiefComplaint}>
                      {item.chiefComplaint}
                    </td>

                    {/* Location / Room */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-medium">
                        {item.roomOrBooth}
                      </span>
                    </td>

                    {/* Queue Status Dropdown */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isDoctor ? (
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item.id, e.target.value as QueueStatus)}
                          className={`text-xs font-bold rounded-full px-3 py-1 border focus:outline-hidden cursor-pointer ${
                            item.status === "In-Consultation"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : item.status === "Waiting"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : item.status === "Completed"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <option value="Waiting">Waiting</option>
                          <option value="In-Consultation">In-Consultation</option>
                          <option value="Completed">Completed</option>
                          <option value="Referred">Referred</option>
                          <option value="No-Show">No-Show</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block text-[11px] font-bold rounded-full px-3 py-1 border ${
                            item.status === "In-Consultation"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : item.status === "Waiting"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </td>

                    {/* Role-Specific Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isDoctor ? (
                        <button
                          onClick={() => handleStartConsult(item)}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-105"
                        >
                          <Stethoscope size={13} strokeWidth={2} />
                          <span>Consult</span>
                        </button>
                      ) : user?.role === "nurse" ? (
                        <button
                          onClick={() => {
                            const p = patients.find(pat => pat.id === item.patientId);
                            if (p) contextSetSelectedPatient(p);
                            navigate("/clinical?tab=vitals");
                          }}
                          className="px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 border border-teal-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Activity size={12} />
                          <span>Record Vitals</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const p = patients.find(pat => pat.id === item.patientId);
                            if (p) contextSetSelectedPatient(p);
                            navigate("/registration/directory");
                          }}
                          className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck size={12} />
                          <span>Admissions</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
