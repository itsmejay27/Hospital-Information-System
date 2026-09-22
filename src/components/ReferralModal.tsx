import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { OpdReferral, Patient } from "../types";
import {
  X,
  Send,
  Building2,
  Stethoscope,
  AlertTriangle,
  Check,
  ChevronRight,
  ChevronLeft,
  FileText,
  ShieldCheck,
  Clock,
  HeartPulse,
} from "./Icons";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPatientId?: string;
}

export default function ReferralModal({
  isOpen,
  onClose,
  defaultPatientId,
}: ReferralModalProps) {
  const { user } = useAuth();
  const { patients, selectedPatient, addReferral, addAuditLog } = useOpdData();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const initialPatientId = defaultPatientId || selectedPatient?.id || patients[0]?.id || "";
  const [selectedPatId, setSelectedPatId] = useState<string>(initialPatientId);

  // Step 1: Patient Context & Diagnosis
  const [preliminaryDiagnosis, setPreliminaryDiagnosis] = useState("Suspected Unstable Angina / Non-ST Elevation ACS");
  const [clinicalSummary, setClinicalSummary] = useState(
    "Patient presented with progressive retrosternal chest discomfort radiating to the left jaw and shoulder. ECG demonstrates T-wave inversions in V3-V6. Serial troponin-I mildly elevated. Initial nitrates and dual antiplatelet therapy administered."
  );

  // Step 2: Target Specialty & Consulting Department
  const [destinationFacility, setDestinationFacility] = useState("Philippine General Hospital (PGH)");
  const [targetDepartment, setTargetDepartment] = useState("Cardiology Subspecialty Clinic");
  const [specialistType, setSpecialistType] = useState("Interventional Cardiologist");
  const [transportRequirements, setTransportRequirements] = useState("Hospital Ambulance with Advanced Life Support (ALS)");

  // Step 3: Priority Urgency
  const [priority, setPriority] = useState<"Routine" | "Urgent" | "Stat Emergency">("Urgent");
  const [urgencyJustification, setUrgencyJustification] = useState("Requires urgent coronary angiography, risk stratification, and potential cardiac catheterization.");
  const [transitPrecautions, setTransitPrecautions] = useState("Continuous cardiac telemetry, continuous O2 via nasal cannula @ 3 LPM, bedside emergency suction and defibrillator on standby.");

  // Step 4: Electronic Signature & Dispatch
  const [referringDoctorName, setReferringDoctorName] = useState(user?.name || "Dr. Mark Arkiel Jacobe, MD");
  const [referringDoctorLicense, setReferringDoctorLicense] = useState(user?.licenseNumber || "PRC Lic. #0089201");
  const [authAgreement, setAuthAgreement] = useState(true);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  if (!isOpen) return null;

  const currentPatient = patients.find(p => p.id === selectedPatId) || patients[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const referralId = `REF-2026-${Date.now().toString().slice(-4)}`;
    const newRef: OpdReferral = {
      id: referralId,
      patientId: currentPatient ? currentPatient.id : "P-UNKNOWN",
      patientName: currentPatient ? currentPatient.name : "Active Patient",
      referredFrom: "CarePoint Outpatient Department",
      referredTo: `${destinationFacility} — ${targetDepartment}`,
      reason: `${preliminaryDiagnosis}: ${urgencyJustification} (${clinicalSummary.slice(0, 80)}...)`,
      priority: priority,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      referringDoctor: `${referringDoctorName} (${referringDoctorLicense})`,
      status: "Pending",
    };

    addReferral(newRef);

    if (addAuditLog) {
      addAuditLog({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        userName: referringDoctorName,
        userRole: (user?.role as any) || "doctor",
        userLicense: referringDoctorLicense,
        action: `Issued ${priority} Specialist Referral to ${destinationFacility}`,
        targetPatient: currentPatient?.name || "Patient",
        patientId: currentPatient?.id || "P-UNKNOWN",
        department: "Outpatient Department",
        ipAddress: "192.168.10.42",
        status: "Authorized",
      });
    }

    setSubmittedSuccessfully(true);

    setTimeout(() => {
      setSubmittedSuccessfully(false);
      setStep(1);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-teal-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
              <Send size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="font-serif font-bold text-base text-white flex items-center gap-2">
                <span>Specialist Referral Workflow</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-full font-mono">
                  4-STEP PROTOCOL
                </span>
              </div>
              <div className="text-[11px] text-teal-300/90 font-medium">
                CarePoint Medical Center • Multi-Step External & Specialist Transfer
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

        {/* 4-Step Interactive Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
              step === 1 ? "font-bold text-teal-700" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              1
            </span>
            <span className="whitespace-nowrap">Context & Diagnosis</span>
          </button>

          <ChevronRight size={13} className="text-slate-300 shrink-0" />

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
              step === 2 ? "font-bold text-teal-700" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            <span className="whitespace-nowrap">Specialty & Dept</span>
          </button>

          <ChevronRight size={13} className="text-slate-300 shrink-0" />

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
              step === 3 ? "font-bold text-teal-700" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 3 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </span>
            <span className="whitespace-nowrap">Priority Urgency</span>
          </button>

          <ChevronRight size={13} className="text-slate-300 shrink-0" />

          <button
            type="button"
            onClick={() => setStep(4)}
            className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
              step === 4 ? "font-bold text-teal-700" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 4 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              4
            </span>
            <span className="whitespace-nowrap">Sign & Dispatch</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {submittedSuccessfully ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Referral Dispatched Successfully</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Official clinical referral for <strong>{currentPatient?.name}</strong> to{" "}
                <strong>{destinationFacility}</strong> has been authorized and dispatched.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ============================================================ */}
              {/* STEP 1: PATIENT CONTEXT & DIAGNOSIS */}
              {/* ============================================================ */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Target Patient Selection
                    </label>
                    <select
                      value={selectedPatId}
                      onChange={e => setSelectedPatId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:border-teal-500 outline-hidden"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id}) — {p.age}y/o {p.gender} • Triage: {p.triageTier.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    {currentPatient && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Age / Sex:</span>
                          <strong className="text-slate-800">{currentPatient.age}y/o • {currentPatient.gender}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Blood Type:</span>
                          <strong className="text-teal-700">{currentPatient.bloodType}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Allergies:</span>
                          <strong className="text-rose-700 truncate block">{currentPatient.allergies.join(", ")}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Acuity Tier:</span>
                          <span className="inline-block px-1.5 py-0.5 rounded font-bold uppercase text-[9px] bg-amber-100 text-amber-800">
                            {currentPatient.triageTier}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Presenting Chief Complaint
                    </label>
                    <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium">
                      {currentPatient?.chiefComplaint || "Cardiopulmonary assessment"}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Preliminary Working Diagnosis <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={preliminaryDiagnosis}
                      onChange={e => setPreliminaryDiagnosis(e.target.value)}
                      placeholder="e.g. Unstable Angina; Severe Traumatic Brain Injury"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Clinical Encounter Summary & Findings <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={clinicalSummary}
                      onChange={e => setClinicalSummary(e.target.value)}
                      placeholder="Detail current clinical symptoms, examination findings, diagnostic values, and initial medications given..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 2: TARGET SPECIALTY & CONSULTING DEPARTMENT */}
              {/* ============================================================ */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Destination Healthcare Facility <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={destinationFacility}
                      onChange={e => setDestinationFacility(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-semibold text-slate-800"
                    >
                      <option value="Philippine General Hospital (PGH)">Philippine General Hospital (PGH) — Manila</option>
                      <option value="Philippine Heart Center (PHC)">Philippine Heart Center (PHC) — Quezon City</option>
                      <option value="National Kidney and Transplant Institute (NKTI)">National Kidney and Transplant Institute (NKTI)</option>
                      <option value="Lung Center of the Philippines (LCP)">Lung Center of the Philippines (LCP)</option>
                      <option value="National Center for Mental Health (NCMH)">National Center for Mental Health (NCMH)</option>
                      <option value="St. Luke's Medical Center (BGC)">St. Luke's Medical Center — Global City</option>
                      <option value="The Medical City (Ortigas)">The Medical City — Ortigas</option>
                      <option value="Cardinal Santos Medical Center">Cardinal Santos Medical Center — San Juan</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Consulting Specialty <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={specialistType}
                        onChange={e => setSpecialistType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden"
                      >
                        <option value="Interventional Cardiologist">Interventional Cardiology</option>
                        <option value="Adult Pulmonologist">Adult Pulmonology</option>
                        <option value="Nephrologist">Nephrology & Renal Dialysis</option>
                        <option value="Neurologist / Neurosurgeon">Neurology & Neurosurgery</option>
                        <option value="Orthopedic Surgeon">Orthopedic & Trauma Surgery</option>
                        <option value="Medical Oncologist">Medical Oncology</option>
                        <option value="Gastroenterologist">Gastroenterology</option>
                        <option value="Psychiatrist">Adult & Geriatric Psychiatry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Target Department / Unit
                      </label>
                      <input
                        type="text"
                        value={targetDepartment}
                        onChange={e => setTargetDepartment(e.target.value)}
                        placeholder="e.g. Coronary Care Unit (CCU)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Transport & Logistical Requirements
                    </label>
                    <select
                      value={transportRequirements}
                      onChange={e => setTransportRequirements(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden"
                    >
                      <option value="Hospital Ambulance with Advanced Life Support (ALS)">
                        Hospital Ambulance with Advanced Life Support (ALS) & Paramedic Team
                      </option>
                      <option value="Basic Life Support (BLS) Ambulance">
                        Basic Life Support (BLS) Ambulance with Nurse Escort
                      </option>
                      <option value="Wheelchair / Stretcher Patient Transport">
                        Assisted Stretcher Patient Transport
                      </option>
                      <option value="Private / Outpatient Self-Transport">
                        Private Vehicle / Outpatient Self-Transport
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 3: PRIORITY URGENCY */}
              {/* ============================================================ */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block font-bold text-slate-700 mb-2">
                      Referral Urgency Classification <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPriority("Routine")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          priority === "Routine"
                            ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-emerald-800 text-xs">Routine Consult</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Elective appointment within 5–7 calendar days
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPriority("Urgent")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          priority === "Urgent"
                            ? "bg-amber-50 border-amber-500 ring-2 ring-amber-200"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-amber-800 text-xs">Urgent Priority</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Specialist evaluation required within 24–48 hours
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPriority("Stat Emergency")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          priority === "Stat Emergency"
                            ? "bg-rose-50 border-rose-500 ring-2 ring-rose-200"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-rose-800 text-xs flex items-center gap-1">
                          <AlertTriangle size={13} />
                          <span>Stat Emergency</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Immediate transfer with active medical escort
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Clinical Urgency Justification <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={urgencyJustification}
                      onChange={e => setUrgencyJustification(e.target.value)}
                      placeholder="Why does this patient require transfer at this urgency level?"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Transit Precautions & Bedside Monitoring Directives
                    </label>
                    <textarea
                      rows={2}
                      value={transitPrecautions}
                      onChange={e => setTransitPrecautions(e.target.value)}
                      placeholder="Special instructions during transit (e.g. oxygen, IV fluids, telemetry)..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 4: ELECTRONIC SIGNATURE & DISPATCH */}
              {/* ============================================================ */}
              {step === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Summary Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>Referral Dispatch Summary</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          priority === "Stat Emergency"
                            ? "bg-rose-100 text-rose-800"
                            : priority === "Urgent"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Patient Name:</span>
                        <strong className="text-slate-800">{currentPatient?.name} ({currentPatient?.id})</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Destination:</span>
                        <strong className="text-slate-800">{destinationFacility}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Target Specialty:</span>
                        <strong className="text-slate-800">{specialistType}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Transport:</span>
                        <strong className="text-slate-800 truncate block">{transportRequirements}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Referring Physician Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={referringDoctorName}
                        onChange={e => setReferringDoctorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        PRC License & Accreditation
                      </label>
                      <input
                        type="text"
                        required
                        value={referringDoctorLicense}
                        onChange={e => setReferringDoctorLicense(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  {/* Digital Signature Confirmation */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-teal-200 bg-teal-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authAgreement}
                      onChange={e => setAuthAgreement(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 shrink-0"
                    />
                    <span className="text-[11px] text-teal-900 leading-relaxed">
                      I hereby certify that this clinical referral is warranted under established medical protocols. An electronic signature and SHA-256 audit digest will be attached to this transfer request.
                    </span>
                  </label>
                </div>
              )}

              {/* Step Navigation Controls */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as any)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep((step + 1) as any)}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Step {step + 1}</span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!authAgreement}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={15} strokeWidth={2} />
                    <span>Authorize & Dispatch Referral</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center shrink-0">
          CarePoint Medical Center • Clinical Governance & Specialist Referral System
        </div>
      </div>
    </div>
  );
}
