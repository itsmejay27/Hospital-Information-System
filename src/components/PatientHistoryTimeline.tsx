import React, { useState } from "react";
import { Patient, HealthRecord, MedicationOrder, DiagnosticResult } from "../types";
import {
  History,
  X,
  Stethoscope,
  Pill,
  FlaskConical,
  Activity,
  Calendar,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "./Icons";

interface PatientHistoryTimelineProps {
  patient: Patient;
  records: HealthRecord[];
  medications?: MedicationOrder[];
  labResults?: DiagnosticResult[];
  onClose: () => void;
}

export default function PatientHistoryTimeline({
  patient,
  records,
  medications = [],
  labResults = [],
  onClose,
}: PatientHistoryTimelineProps) {
  // Filter for this specific patient
  const patientRecords = records
    .filter(r => r.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const patientMeds = medications.filter(m => m.patientId === patient.id);
  const patientLabs = labResults.filter(l => l.patientId === patient.id);

  // State to toggle expanded SOAP details per record
  const [expandedRecords, setExpandedRecords] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (patientRecords.length > 0) {
      initial[patientRecords[0].id] = true; // Expand most recent by default
    }
    return initial;
  });

  const [activeFilter, setActiveFilter] = useState<"all" | "soap" | "meds" | "labs">("all");

  const toggleExpand = (recordId: string) => {
    setExpandedRecords(prev => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-bold">
                <History size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {patient.name}
                  </h2>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {patient.id}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      patient.triageTier === "critical"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : patient.triageTier === "observation"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {patient.triageTier}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {patient.age} yrs • {patient.gender} • Blood: {patient.bloodType} • Registered: {patient.registeredAt}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close history timeline"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick clinical overview strip */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Clinical Encounters</span>
              <span className="font-bold text-teal-300 text-sm">{patientRecords.length} Visits</span>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Active Meds</span>
              <span className="font-bold text-teal-300 text-sm">{patientMeds.length} Prescriptions</span>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Lab Results</span>
              <span className="font-bold text-teal-300 text-sm">{patientLabs.length} Panels</span>
            </div>
          </div>
        </div>

        {/* Chronic Conditions & Allergies Bar */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 text-[11px] uppercase">Allergies:</span>
            <span className="text-rose-600 font-semibold text-[11px]">
              {patient.allergies?.length ? patient.allergies.join(", ") : "NKDA (None reported)"}
            </span>
          </div>
          {patient.medicalHistory?.chronicConditions && patient.medicalHistory.chronicConditions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 text-[11px] uppercase">Chronic:</span>
              <div className="flex gap-1">
                {patient.medicalHistory.chronicConditions.map((cond, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full"
                  >
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Filter Timeline:</span>
          {(
            [
              { id: "all", label: `All Events (${patientRecords.length + patientMeds.length + patientLabs.length})` },
              { id: "soap", label: `SOAP Visits (${patientRecords.length})` },
              { id: "meds", label: `Medications (${patientMeds.length})` },
              { id: "labs", label: `Diagnostics (${patientLabs.length})` },
            ] as const
          ).map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === f.id
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {patientRecords.length === 0 && patientMeds.length === 0 && patientLabs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <AlertCircle size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No Historical Records Found</p>
              <p className="text-xs text-slate-400">
                This patient does not have past clinical encounter records or SOAP notes logged yet.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-teal-200 space-y-6">
              {/* Clinical Encounters / SOAP Records */}
              {(activeFilter === "all" || activeFilter === "soap") &&
                patientRecords.map(rec => {
                  const isExpanded = !!expandedRecords[rec.id];

                  return (
                    <div key={rec.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center shadow-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      </div>

                      {/* Encounter Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-all space-y-3">
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                {rec.type}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1">
                                <Calendar size={12} className="text-slate-400" />
                                {rec.date}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                              {rec.diagnosis}
                              {rec.icd10Code && (
                                <span className="ml-2 font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                  ICD-10: {rec.icd10Code}
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Stethoscope size={13} className="text-teal-600" />
                              <span>Attending: </span>
                              <span className="font-semibold text-slate-700">{rec.doctor}</span>
                              {rec.doctorLicense && (
                                <span className="text-[10px] text-slate-400 font-mono">({rec.doctorLicense})</span>
                              )}
                            </p>
                          </div>

                          <button
                            onClick={() => toggleExpand(rec.id)}
                            className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                          >
                            <span>{isExpanded ? "Hide Details" : "View SOAP"}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {/* Vitals Snapshot */}
                        {rec.vitals && (
                          <div className="bg-slate-50 rounded-xl p-2.5 grid grid-cols-4 gap-2 text-center text-xs border border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Blood Pressure</span>
                              <span className="font-bold text-slate-800">{rec.vitals.bp || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Heart Rate</span>
                              <span className="font-bold text-slate-800">{rec.vitals.hr || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Temp</span>
                              <span className="font-bold text-slate-800">{rec.vitals.temp || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Weight / BMI</span>
                              <span className="font-bold text-slate-800">{rec.vitals.wt || "—"}</span>
                            </div>
                          </div>
                        )}

                        {/* Expanded Full SOAP View */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
                            {/* Subjective */}
                            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                              <span className="font-bold text-blue-900 uppercase text-[10px] block mb-1">
                                [S] Subjective (Chief Complaint & History)
                              </span>
                              <p className="text-slate-700 leading-relaxed">{rec.subjective}</p>
                            </div>

                            {/* Objective */}
                            <div className="bg-teal-50/50 p-2.5 rounded-xl border border-teal-100">
                              <span className="font-bold text-teal-900 uppercase text-[10px] block mb-1">
                                [O] Objective (Physical Exam & Findings)
                              </span>
                              <p className="text-slate-700 leading-relaxed">{rec.objective}</p>
                            </div>

                            {/* Assessment */}
                            <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                              <span className="font-bold text-amber-900 uppercase text-[10px] block mb-1">
                                [A] Assessment & Clinical Impression
                              </span>
                              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{rec.assessment}</p>
                            </div>

                            {/* Plan */}
                            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                              <span className="font-bold text-emerald-900 uppercase text-[10px] block mb-1">
                                [P] Treatment Plan & Follow-up
                              </span>
                              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{rec.plan}</p>
                            </div>

                            {/* Clinician Internal Notes */}
                            {rec.internalClinicianNotes && (
                              <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-700 uppercase text-[10px] block mb-0.5">
                                  Internal Clinician Note:
                                </span>
                                <p className="text-slate-600 italic">{rec.internalClinicianNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Medications Section (if selected or all) */}
              {(activeFilter === "all" || activeFilter === "meds") && patientMeds.length > 0 && (
                <div className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Pill size={16} className="text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                        Prescription History ({patientMeds.length})
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {patientMeds.map(med => (
                        <div
                          key={med.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{med.name}</span>
                            <span className="text-slate-500 ml-2">
                              {med.dose} • {med.route} • {med.freq}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Prescribed by: {med.prescribedBy} • Started: {med.start}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              med.status === "Active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {med.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Lab Results Section (if selected or all) */}
              {(activeFilter === "all" || activeFilter === "labs") && patientLabs.length > 0 && (
                <div className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-purple-600 flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <FlaskConical size={16} className="text-purple-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                        Diagnostic Lab Results ({patientLabs.length})
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {patientLabs.map(lab => (
                        <div
                          key={lab.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{lab.test}</span>
                            <span className="text-[10px] font-mono text-slate-400">{lab.date}</span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{lab.summary}</p>
                          {lab.items && lab.items.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                              {lab.items.map((item, idx) => (
                                <div key={idx} className="bg-white p-1.5 rounded border border-slate-200 text-[10px]">
                                  <span className="text-slate-500 block truncate">{item.name}</span>
                                  <span className="font-bold text-slate-800">
                                    {item.value} {item.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            CarePoint Medical Center • Official Longitudinal Record
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
