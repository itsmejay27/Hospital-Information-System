import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OpdQueueItem, QueueStatus, Patient, TriageTier } from "../types";
import { useOpdData } from "../context/OpdDataContext";
import {
  Users,
  Search,
  Filter,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  UserCheck,
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
  const {
    queue: contextQueue,
    setQueue: contextSetQueue,
    patients: contextPatients,
    setSelectedPatient: contextSetSelectedPatient,
    callNextPatient,
    consultPatient,
    updateQueueStatus,
    globalSearchQuery,
  } = useOpdData();

  const queue = propsQueue || contextQueue;
  const patients = propsPatients || contextPatients;

  const [searchTerm, setSearchTerm] = useState(globalSearchQuery || "");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [triageFilter, setTriageFilter] = useState<string>("All");

  // Keep search term synchronized when header search query changes
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
        navigate("/workbench");
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
      navigate("/workbench");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Quick Call Next Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <Users size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Live Outpatient Queue System
              </h2>
              <p className="text-xs text-slate-500">
                Manage waiting room arrivals, clinic booth assignments, and triage routing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCallNext}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform hover:scale-102 cursor-pointer"
          >
            <UserCheck size={16} strokeWidth={2.5} />
            <span>Call Next Waiting Patient</span>
          </button>
        </div>
      </div>

      {/* Main Queue Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search
              size={15}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search queue by patient, MRN, complaint, room..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end text-xs">
            {/* Triage Filter */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Triage:</span>
              <select
                value={triageFilter}
                onChange={e => setTriageFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500 cursor-pointer"
              >
                <option value="All">All Tiers</option>
                <option value="critical">Critical (Red)</option>
                <option value="observation">Observation (Yellow)</option>
                <option value="stable">Stable (Green)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Waiting">Waiting</option>
                <option value="In-Consultation">In-Consultation</option>
                <option value="Completed">Completed</option>
                <option value="Referred">Referred</option>
                <option value="No-Show">No-Show</option>
              </select>
            </div>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-3">Triage Tier</th>
                <th className="py-3 px-4">Chief Complaint</th>
                <th className="py-3 px-3">Current Location</th>
                <th className="py-3 px-3">Queue Status</th>
                <th className="py-3 px-4 text-center">Consultation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No patients currently matching the queue filters.
                  </td>
                </tr>
              ) : (
                filteredQueue.map(item => (
                  <tr
                    key={item.id}
                    className={`hover:bg-teal-50/30 transition-colors ${
                      item.status === "In-Consultation" ? "bg-teal-50/20" : ""
                    }`}
                  >
                    {/* Queue Number */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                        {item.queueNumber}
                      </span>
                    </td>

                    {/* Patient Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-xs">
                        {item.patientName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        MRN: {item.patientId} • {item.age} y/o • {item.gender} • In: {item.checkInTime}
                      </div>
                    </td>

                    {/* Triage Tier */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.triageTier === "critical"
                            ? "bg-rose-100 text-rose-700 border border-rose-300"
                            : item.triageTier === "observation"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.triageTier === "critical"
                              ? "bg-rose-600"
                              : item.triageTier === "observation"
                              ? "bg-amber-600"
                              : "bg-emerald-600"
                          }`}
                        ></span>
                        {item.triageTier}
                      </span>
                    </td>

                    {/* Chief Complaint */}
                    <td className="py-3.5 px-4 text-slate-800 max-w-xs font-medium">
                      {item.chiefComplaint}
                    </td>

                    {/* Location / Room */}
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                        {item.roomOrBooth}
                      </span>
                    </td>

                    {/* Queue Status with quick dropdown */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value as QueueStatus)}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-hidden cursor-pointer ${
                          item.status === "In-Consultation"
                            ? "bg-teal-50 text-teal-800 border-teal-300"
                            : item.status === "Waiting"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : item.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-700 border-slate-300"
                        }`}
                      >
                        <option value="Waiting">Waiting</option>
                        <option value="In-Consultation">In-Consultation</option>
                        <option value="Completed">Completed</option>
                        <option value="Referred">Referred</option>
                        <option value="No-Show">No-Show</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStartConsult(item)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="Open in Physician Workbench"
                        >
                          <Stethoscope size={13} strokeWidth={2} />
                          <span>Consult</span>
                        </button>
                      </div>
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
