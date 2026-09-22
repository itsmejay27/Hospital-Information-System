import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { User, Role, Patient, MedicationOrder, DiagnosticResult } from "../types";
import DoctorWorkbenchView from "./DoctorWorkbenchView";
import VitalsBmiView from "./VitalsBmiView";
import PrescriptionModal from "../components/PrescriptionModal";
import LabOrderModal from "../components/LabOrderModal";
import {
  Stethoscope,
  Activity,
  Pill,
  FlaskConical,
  Search,
  Plus,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  User as UserIcon,
  Calendar,
} from "../components/Icons";

export type ClinicalTab = "workbench" | "prescriptions" | "labs" | "vitals";

export default function ClinicalCareView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const {
    patients,
    records,
    addRecord,
    labResults,
    addLabResult,
    medications,
    addMedication,
    treatments,
    addTreatment,
    selectedPatient,
    setSelectedPatient,
  } = useOpdData();

  const currentRole: Role = user?.role || "doctor";
  const isNurse = currentRole === "nurse";

  // Tab state synced with URL search params ?tab=
  const requestedTab = (searchParams.get("tab") as ClinicalTab) || (isNurse ? "vitals" : "workbench");

  // Enforce strict role access: nurse is ONLY allowed "vitals" tab
  const activeTab: ClinicalTab = isNurse ? "vitals" : requestedTab;

  useEffect(() => {
    // If nurse tries to access doctor tabs via query param, force ?tab=vitals
    if (isNurse && searchParams.get("tab") !== "vitals") {
      setSearchParams({ tab: "vitals" }, { replace: true });
    }
  }, [isNurse, searchParams, setSearchParams]);

  const handleTabChange = (tab: ClinicalTab) => {
    if (isNurse && tab !== "vitals") return;
    setSearchParams({ tab });
  };

  // Local state for Prescriptions and Labs tabs
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    selectedPatient?.id || patients[0]?.id || "P-2024-001"
  );
  const [medSearch, setMedSearch] = useState("");
  const [medStatusFilter, setMedStatusFilter] = useState<"All" | "Active" | "Completed" | "Discontinued">("All");
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);

  const [labSearch, setLabSearch] = useState("");
  const [labCategoryFilter, setLabCategoryFilter] = useState<string>("All");
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const currentPatient =
    patients.find(p => p.id === selectedPatientId) || patients[0] || {
      id: "P-2024-001",
      name: "Patient",
      age: 35,
      gender: "Female",
      triageTier: "stable",
      bloodType: "O+",
      chiefComplaint: "Outpatient Assessment",
      admissionStatus: "Outpatient",
      registeredAt: "2026-03-01",
    };

  // Doctor User Fallback
  const doctorUser: User =
    user?.role === "doctor"
      ? user
      : {
          id: user?.id || "DOC-001",
          name: user?.name || "Attending Physician, MD",
          role: "doctor",
          title: "Attending Physician",
          avatarInitials: "AP",
          department: user?.department || "Outpatient Department",
          licenseNumber: user?.licenseNumber || "PRC Lic. Verified",
          status: "active",
        };

  // Nurse User Fallback
  const nurseUser: User =
    user || {
      id: "NURSE-001",
      name: "Triage & Ward Nurse",
      role: "nurse",
      title: "Staff Nurse, RN",
      avatarInitials: "RN",
      department: "Nursing Station",
      licenseNumber: "PRC Lic. Registered Nurse",
      status: "active",
    };

  // Filtered Medications for the Prescriptions Tab
  const patientMeds = medications.filter(m => {
    const matchesPatient = m.patientId === selectedPatientId;
    const matchesSearch =
      m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.prescribedBy.toLowerCase().includes(medSearch.toLowerCase());
    const matchesStatus = medStatusFilter === "All" || m.status === medStatusFilter;
    return matchesPatient && matchesSearch && matchesStatus;
  });

  // Filtered Labs for the Labs & Diagnostics Tab
  const patientLabs = labResults.filter(l => {
    const matchesPatient = l.patientId === selectedPatientId;
    const matchesSearch =
      l.test.toLowerCase().includes(labSearch.toLowerCase()) ||
      l.summary.toLowerCase().includes(labSearch.toLowerCase()) ||
      l.orderingPhysician.toLowerCase().includes(labSearch.toLowerCase());
    const matchesCategory = labCategoryFilter === "All" || l.category === labCategoryFilter;
    return matchesPatient && matchesSearch && matchesCategory;
  });

  // Allowed tabs based on role
  const availableTabs = [
    {
      id: "workbench" as ClinicalTab,
      label: "Doctor Workbench",
      icon: Stethoscope,
      doctorOnly: true,
      description: "SOAP encounters, clinical diagnosis, and triage management",
    },
    {
      id: "prescriptions" as ClinicalTab,
      label: "e-Prescriptions & Rx",
      icon: Pill,
      doctorOnly: true,
      badge: medications.filter(m => m.status === "Active").length,
      description: "Digital prescription orders, PhilHealth Konsulta meds",
    },
    {
      id: "labs" as ClinicalTab,
      label: "Labs & Diagnostics",
      icon: FlaskConical,
      doctorOnly: true,
      badge: labResults.length,
      description: "Laboratory orders, radiology requisitions, diagnostic panels",
    },
    {
      id: "vitals" as ClinicalTab,
      label: "Vitals & BMI Assessment",
      icon: Activity,
      doctorOnly: false,
      description: "Bedside hemodynamics, blood pressure, SpO2, fluid balance",
    },
  ].filter(tab => !isNurse || !tab.doctorOnly);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-teal-900 text-teal-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-teal-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-teal-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-teal-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Clinical Care Header with Tabbed Navigation */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-emerald-500/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              CarePoint Clinical Care • Unified Service
            </span>
            <span className="text-xs text-emerald-200/80 font-mono">/clinical</span>
            {isNurse && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-300/30">
                Nurse Triaging Mode (Vitals Only)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Stethoscope size={28} className="text-emerald-300" />
            <span>Clinical Care & Diagnostics Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Integrated physician consultations, clinical prescriptions, laboratory orders, and bedside hemodynamics.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-xs">
          <div className="w-11 h-11 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-300/40 flex items-center justify-center font-bold text-sm shadow-inner">
            {user?.avatarInitials || "MD"}
          </div>
          <div className="text-right sm:text-left">
            <span className="text-xs font-bold text-white block leading-tight">
              {user?.name || "Clinician"}
            </span>
            <span className="text-[10px] text-emerald-300 uppercase font-semibold">
              {user?.role || "Staff"} • {user?.licenseNumber || "PRC Certified"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        {availableTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon size={16} strokeWidth={2.2} className={isActive ? "text-white" : "text-slate-500"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DOCTOR WORKBENCH (Doctors Only) */}
      {/* ========================================================================= */}
      {activeTab === "workbench" && !isNurse && (
        <DoctorWorkbenchView
          user={doctorUser}
          patients={patients}
          records={records}
          onAddRecord={addRecord}
          labResults={labResults}
          onAddLabResult={addLabResult}
          medications={medications}
          onAddMedication={addMedication}
          initialPatientId={selectedPatientId}
          onSignOut={logout}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: e-PRESCRIPTIONS & RX (Doctors Only) */}
      {/* ========================================================================= */}
      {activeTab === "prescriptions" && !isNurse && (
        <div className="space-y-6">
          {/* Patient Selection & Quick Stats Strip */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                <Pill size={20} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block">Select Patient For Rx:</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-xs text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) — Blood: {p.bloodType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setIsRxModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-xs transition-all hover:scale-102 flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>+ Issue New e-Prescription</span>
              </button>
            </div>
          </div>

          {/* Prescriptions Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={medSearch}
                  onChange={e => setMedSearch(e.target.value)}
                  placeholder="Search medication name, dose, or prescriber..."
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full sm:w-72 focus:outline-hidden focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Filter Status:</span>
                {(["All", "Active", "Completed", "Discontinued"] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setMedStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      medStatusFilter === status
                        ? "bg-indigo-700 text-white font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {patientMeds.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No medication records found for this patient matching your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-3 px-3">Medication Name</th>
                      <th className="py-3 px-3">Dose & Route</th>
                      <th className="py-3 px-3">Frequency</th>
                      <th className="py-3 px-3">Prescribed By</th>
                      <th className="py-3 px-3">Start Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientMeds.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-400">{m.refillable ? "Refillable Rx" : "Non-refillable"}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-semibold">
                          {m.dose} • {m.route}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{m.freq}</td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{m.prescribedBy}</div>
                          {m.prescribedByLicense && (
                            <div className="text-[10px] font-mono text-slate-400">{m.prescribedByLicense}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{m.start}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              m.status === "Active"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : m.status === "Completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => notify(`Rx for ${m.name} copied / transmitted to pharmacy.`)}
                            className="text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            Print / Re-issue
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <PrescriptionModal
            isOpen={isRxModalOpen}
            onClose={() => setIsRxModalOpen(false)}
            patient={currentPatient}
            doctorUser={doctorUser}
            onAddMedication={newMed => {
              addMedication(newMed);
              notify(`e-Prescription for "${newMed.name}" issued successfully.`);
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LABS & DIAGNOSTICS (Doctors Only) */}
      {/* ========================================================================= */}
      {activeTab === "labs" && !isNurse && (
        <div className="space-y-6">
          {/* Patient Selection Strip */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                <FlaskConical size={20} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block">Select Patient For Labs:</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-xs text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) — {p.triageTier.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setIsLabModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-xs transition-all hover:scale-102 flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>+ Order Diagnostic Lab</span>
              </button>
            </div>
          </div>

          {/* Labs Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={labSearch}
                  onChange={e => setLabSearch(e.target.value)}
                  placeholder="Search test name, category, or physician..."
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full sm:w-72 focus:outline-hidden focus:bg-white focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-bold uppercase text-slate-400">Category:</span>
                {(["All", "Hematology", "Clinical Chemistry", "Radiology", "Cardiology"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setLabCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      labCategoryFilter === cat
                        ? "bg-amber-700 text-white font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {patientLabs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No diagnostic lab results found for this patient matching your filter.
              </div>
            ) : (
              <div className="space-y-4">
                {patientLabs.map(lab => (
                  <div
                    key={lab.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs space-y-2 hover:border-amber-300 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{lab.test}</span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          {lab.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{lab.date}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            lab.status === "Ready"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {lab.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600">{lab.summary}</p>

                    {lab.items && lab.items.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {lab.items.map((item, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-400 block truncate">{item.name}</span>
                            <span className="font-bold text-slate-800 text-xs">
                              {item.value} {item.unit}
                            </span>
                            <span className="text-[9px] text-slate-400 block">Ref: {item.ref}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-200/40">
                      <span>Ordering Physician: {lab.orderingPhysician}</span>
                      <span>Released By: {lab.releasedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <LabOrderModal
            isOpen={isLabModalOpen}
            onClose={() => setIsLabModalOpen(false)}
            patient={currentPatient}
            doctorUser={doctorUser}
            onAddLabResult={newLab => {
              addLabResult(newLab);
              notify(`Diagnostic lab order for "${newLab.test}" successfully placed.`);
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VITALS & BMI ASSESSMENT (Doctors & Nurses) */}
      {/* ========================================================================= */}
      {activeTab === "vitals" && (
        <VitalsBmiView
          user={isNurse ? nurseUser : doctorUser}
          patients={patients}
          treatments={treatments}
          onAddTreatment={addTreatment}
          initialPatientId={selectedPatientId}
          onSignOut={logout}
        />
      )}
    </div>
  );
}
