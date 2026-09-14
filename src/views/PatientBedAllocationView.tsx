import React, { useState } from "react";
import { User, Patient, AdmissionEntry, TriageTier } from "../types";
import {
  Bed,
  UserPlus,
  Users,
  Search,
  Check,
  Activity,
  AlertTriangle,
  FileCheck,
  Plus,
  Building2,
} from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  admissions: AdmissionEntry[];
  onAddAdmission: (admission: AdmissionEntry) => void;
  onUpdatePatientStatus: (patientId: string, status: Patient["admissionStatus"], ward?: string, bed?: string) => void;
  onSignOut?: () => void;
}

export default function PatientBedAllocationView({
  user,
  patients,
  admissions,
  onAddAdmission,
  onUpdatePatientStatus,
}: Props) {
  const [notification, setNotification] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [wardFilter, setWardFilter] = useState("all");

  // Form State for Bed Allocation
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "");
  const [admitWard, setAdmitWard] = useState("Medical Ward (4th Floor)");
  const [admitBed, setAdmitBed] = useState("Bed 401-A");
  const [admitDoctor, setAdmitDoctor] = useState("Attending Physician, MD (Internal Medicine)");
  const [admitReason, setAdmitReason] = useState("");
  const [admitTriage, setAdmitTriage] = useState<TriageTier>("observation");
  const [admitStatus, setAdmitStatus] = useState<"Admitted" | "Observation">("Admitted");

  // Tally & Metrics
  const activeAdmissions = admissions.filter(a => a.status === "Admitted" || a.status === "Observation");
  const occupiedCount = activeAdmissions.length;
  const totalBeds = 48; // Total hospital ward capacity
  const availableBeds = Math.max(0, totalBeds - occupiedCount);
  const occupancyPercentage = Math.round((occupiedCount / totalBeds) * 100);
  const criticalCount = activeAdmissions.filter(a => a.triageTier === "critical").length;

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const newAdmission: AdmissionEntry = {
      id: `ADM-2026-${String(admissions.length + 1).padStart(3, "0")}`,
      patientId: patient.id,
      patientName: patient.name,
      admissionDate: new Date().toISOString().replace("T", " ").substring(0, 16),
      ward: admitWard,
      bed: admitBed,
      attendingPhysician: admitDoctor,
      admittingStaff: `${user.name} (${user.title})`,
      reason: admitReason || patient.chiefComplaint || "Inpatient continuous monitoring and management",
      triageTier: admitTriage,
      status: admitStatus,
    };

    onAddAdmission(newAdmission);
    onUpdatePatientStatus(patient.id, admitStatus, admitWard, admitBed);
    setNotification(
      `Patient ${patient.name} (${patient.id}) successfully assigned to ${admitWard} • ${admitBed}.`
    );
    setAdmitReason("");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDischargePatient = (admission: AdmissionEntry) => {
    onUpdatePatientStatus(admission.patientId, "Discharged", undefined, undefined);
    setNotification(`Bed ${admission.bed} in ${admission.ward} vacated. Patient ${admission.patientName} discharged.`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Filtered admissions list
  const filteredAdmissions = activeAdmissions.filter(adm => {
    const matchesSearch =
      adm.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.bed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.attendingPhysician.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (wardFilter === "all") return true;
    return adm.ward.toLowerCase().includes(wardFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-emerald-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-emerald-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Admissions & Front Desk • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/registration/beds</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bed size={24} className="text-emerald-600" />
            <span>Inpatient Ward & Bed Allocation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admissions Desk Officer: <span className="font-semibold text-slate-800">{user.name}</span> • {user.department}
          </p>
        </div>
      </div>

      {/* Ward Occupancy Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ward Capacity</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalBeds} Beds</div>
            <span className="text-[10px] text-slate-500">Certified Inpatient Units</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Occupied Units</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{occupiedCount} Beds</div>
            <span className="text-[10px] font-semibold text-emerald-600">{occupancyPercentage}% Occupancy Rate</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bed size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Available Beds</span>
            <div className="text-2xl font-black text-blue-700 mt-1">{availableBeds} Vacant</div>
            <span className="text-[10px] text-slate-500">Ready for immediate intake</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserPlus size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Critical Acuity Watch</span>
            <div className="text-2xl font-black text-rose-700 mt-1">{criticalCount} Inpatients</div>
            <span className="text-[10px] text-rose-600 font-semibold">Tier 1 Intensive Monitoring</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Bed Allocation Intake Form (Left) & Active Ward Roster Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Direct Inpatient Bed Allocation Form (5 Cols) */}
        <div className="lg:col-span-5">
          <form onSubmit={handleAdmitSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Bed size={18} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  New Bed Allocation Intake Form
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Inpatient Admission
              </span>
            </div>

            <div className="space-y-3">
              {/* Select Patient */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Select Registered Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  required
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) — {p.admissionStatus}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward & Bed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Assigned Ward <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={admitWard}
                    onChange={e => setAdmitWard(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Medical Ward (4th Floor)">Medical Ward (4th Floor)</option>
                    <option value="Surgical Ward (3rd Floor)">Surgical Ward (3rd Floor)</option>
                    <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                    <option value="Pediatric Ward (2nd Floor)">Pediatric Ward (2nd Floor)</option>
                    <option value="OB-GYN Ward (5th Floor)">OB-GYN Ward (5th Floor)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Bed / Room Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={admitBed}
                    onChange={e => setAdmitBed(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Bed 401-A"
                    required
                  />
                </div>
              </div>

              {/* Attending Physician */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Attending Physician
                </label>
                <input
                  type="text"
                  value={admitDoctor}
                  onChange={e => setAdmitDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  placeholder="Doctor name & specialty"
                />
              </div>

              {/* Triage Acuity & Admission Status */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Triage Acuity
                  </label>
                  <select
                    value={admitTriage}
                    onChange={e => setAdmitTriage(e.target.value as TriageTier)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="stable">Stable (Tier 3)</option>
                    <option value="observation">Observation (Tier 2)</option>
                    <option value="critical">Critical Care (Tier 1)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Admission Status
                  </label>
                  <select
                    value={admitStatus}
                    onChange={e => setAdmitStatus(e.target.value as "Admitted" | "Observation")}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Admitted">Formally Admitted</option>
                    <option value="Observation">Ward Observation</option>
                  </select>
                </div>
              </div>

              {/* Admission Reason */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Clinical Indication & Diagnosis
                </label>
                <textarea
                  rows={2}
                  value={admitReason}
                  onChange={e => setAdmitReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Inpatient IV antibiotic management and continuous cardiopulmonary monitoring..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                <span>Confirm Bed Allocation & Admit</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Active Inpatient Ward Allocation Table (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Users size={16} className="text-slate-600" />
                  <span>Active Inpatient Bed Allocation Directory ({filteredAdmissions.length})</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search patient or bed..."
                    className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 focus:outline-hidden focus:bg-white"
                  />
                </div>

                {/* Ward Filter */}
                <select
                  value={wardFilter}
                  onChange={e => setWardFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-hidden"
                >
                  <option value="all">All Wards</option>
                  <option value="medical">Medical</option>
                  <option value="surgical">Surgical</option>
                  <option value="icu">ICU</option>
                </select>
              </div>
            </div>

            {filteredAdmissions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No active inpatient bed allocations found matching the filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-2.5 px-3">Patient & MRN</th>
                      <th className="py-2.5 px-3">Ward & Bed</th>
                      <th className="py-2.5 px-3">Admission Time</th>
                      <th className="py-2.5 px-3">Acuity</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdmissions.map(adm => (
                      <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{adm.patientName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{adm.patientId}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block border border-emerald-200 text-[11px]">
                            {adm.bed}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{adm.ward}</div>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-600">
                          <div>{adm.admissionDate}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{adm.attendingPhysician}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              adm.triageTier === "critical"
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : adm.triageTier === "observation"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            }`}
                          >
                            {adm.triageTier || "Stable"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDischargePatient(adm)}
                            className="text-[10px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Vacate Bed
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
