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
  const { patients, selectedPatient, addReferral } = useOpdData();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const initialPatientId = defaultPatientId || selectedPatient?.id || patients[0]?.id || "";
  const [selectedPatId, setSelectedPatId] = useState<string>(initialPatientId);
  const [destinationFacility, setDestinationFacility] = useState("Philippine General Hospital (PGH)");
  const [targetDepartment, setTargetDepartment] = useState("Cardiology Subspecialty Clinic");
  const [specialistType, setSpecialistType] = useState("Interventional Cardiologist");
  const [referralReason, setReferralReason] = useState("Urgent coronary angiography and expert cardiology evaluation following persistent chest pain.");
  const [clinicalSummary, setClinicalSummary] = useState("Patient presented with recurrent retrosternal chest tightness radiating to the left shoulder. ECG indicates ST-depression in V4-V6. Initial troponin mildly elevated.");
  const [priority, setPriority] = useState<"Routine" | "Urgent" | "Stat Emergency">("Urgent");
  const [transportRequirements, setTransportRequirements] = useState("Hospital Ambulance with Advanced Life Support (ALS)");
  const [referringDoctorName, setReferringDoctorName] = useState(user?.name || "Dr. Mark Arkiel Jacobe, MD");
  const [referringDoctorLicense, setReferringDoctorLicense] = useState(user?.licenseNumber || "PRC Lic. #0089201");
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  if (!isOpen) return null;

  const currentPatient = patients.find(p => p.id === selectedPatId) || patients[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRef: OpdReferral = {
      id: `REF-2026-${Date.now().toString().slice(-4)}`,
      patientId: currentPatient ? currentPatient.id : "P-UNKNOWN",
      patientName: currentPatient ? currentPatient.name : "Active Patient",
      referredFrom: "CarePoint Outpatient Department",
      referredTo: `${destinationFacility} — ${targetDepartment}`,
      reason: `${referralReason} (${clinicalSummary.slice(0, 100)}...)`,
      priority: priority,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      referringDoctor: `${referringDoctorName} (${referringDoctorLicense})`,
      status: "Pending",
    };

    addReferral(newRef);
    setSubmittedSuccessfully(true);

    setTimeout(() => {
      setSubmittedSuccessfully(false);
      setStep(1);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
              <Send size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="font-serif font-bold text-base text-white">
                Clinical Referral Workflow
              </div>
              <div className="text-[11px] text-teal-300">
                CarePoint Medical Center • Multi-Step External & Specialist Transfer
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              1
            </span>
            <span className={step === 1 ? "font-bold text-slate-900" : "text-slate-500"}>
              Facility & Department
            </span>
          </div>

          <ChevronRight size={14} className="text-slate-400" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 2 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              2
            </span>
            <span className={step === 2 ? "font-bold text-slate-900" : "text-slate-500"}>
              Clinical Reason
            </span>
          </div>

          <ChevronRight size={14} className="text-slate-400" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 3 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              3
            </span>
            <span className={step === 3 ? "font-bold text-slate-900" : "text-slate-500"}>
              Clinician Sign-off
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {submittedSuccessfully ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Referral Request Issued</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Official clinical referral for <strong>{currentPatient?.name}</strong> to{" "}
                <strong>{destinationFacility}</strong> has been logged into the OPD ledger.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Patient *</label>
                    <select
                      value={selectedPatId}
                      onChange={(e) => setSelectedPatId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium focus:border-teal-500 outline-hidden"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id}) — {p.gender}, {p.age}y/o [{p.triageTier.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Destination Healthcare Facility *
                    </label>
                    <select
                      value={destinationFacility}
                      onChange={(e) => setDestinationFacility(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden"
                    >
                      <option value="Philippine General Hospital (PGH)">
                        Philippine General Hospital (PGH) — Manila
                      </option>
                      <option value="Philippine Heart Center (PHC)">
                        Philippine Heart Center (PHC) — Quezon City
                      </option>
                      <option value="National Kidney and Transplant Institute (NKTI)">
                        National Kidney and Transplant Institute (NKTI)
                      </option>
                      <option value="Lung Center of the Philippines">
                        Lung Center of the Philippines (LCP)
                      </option>
                      <option value="Rizal Medical Center (RMC)">
                        Rizal Medical Center (RMC) — Pasig City
                      </option>
                      <option value="St. Luke's Medical Center (BGC)">
                        St. Luke's Medical Center — Global City
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Receiving Specialty Department
                      </label>
                      <select
                        value={targetDepartment}
                        onChange={(e) => setTargetDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden"
                      >
                        <option value="Cardiology Subspecialty Clinic">Cardiology Subspecialty</option>
                        <option value="Cardiovascular Surgery (TCVS)">Cardiovascular Surgery (TCVS)</option>
                        <option value="Nephrology & Dialysis">Nephrology & Dialysis</option>
                        <option value="Pulmonology & Respiratory Care">Pulmonology & Critical Care</option>
                        <option value="General & Laparoscopic Surgery">General & Trauma Surgery</option>
                        <option value="Neurology & Stroke Center">Neurology & Stroke Center</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Specialist Discipline
                      </label>
                      <input
                        type="text"
                        value={specialistType}
                        onChange={(e) => setSpecialistType(e.target.value)}
                        placeholder="e.g. Interventional Cardiologist"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Primary Clinical Indication / Reason for Referral *
                    </label>
                    <input
                      type="text"
                      required
                      value={referralReason}
                      onChange={(e) => setReferralReason(e.target.value)}
                      placeholder="e.g. Diagnostic Cardiac Catheterization / Urgent ICU Evaluation"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Pertinent Clinical Summary & Diagnostic Findings *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={clinicalSummary}
                      onChange={(e) => setClinicalSummary(e.target.value)}
                      placeholder="Summary of presentation, vitals, lab findings, and medications administered..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-teal-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Transfer Priority / Urgency
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-bold"
                      >
                        <option value="Routine">Green — Routine Elective</option>
                        <option value="Urgent">Yellow — Urgent Transfer (&lt; 24 hrs)</option>
                        <option value="Stat Emergency">Red — Stat Emergency (Immediate ALS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Required Transport Logistics
                      </label>
                      <input
                        type="text"
                        value={transportRequirements}
                        onChange={(e) => setTransportRequirements(e.target.value)}
                        placeholder="Ambulance / BLS / Private"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-3.5">
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900">Referral Order Overview</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-200 text-teal-800">
                        {priority}
                      </span>
                    </div>
                    <div className="text-slate-700 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500">Patient:</span>{" "}
                        <strong>{currentPatient?.name}</strong> ({currentPatient?.age}y/o)
                      </div>
                      <div>
                        <span className="text-slate-500">Receiving:</span>{" "}
                        <strong>{destinationFacility}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Indication:</span> {referralReason}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Referring Clinician Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={referringDoctorName}
                        onChange={(e) => setReferringDoctorName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        PRC License Stamp *
                      </label>
                      <input
                        type="text"
                        required
                        value={referringDoctorLicense}
                        onChange={(e) => setReferringDoctorLicense(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Generating this referral creates an auditable clinical endorsement per DOH A.O. 2012-0012 inter-facility transfer standards.
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as any)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                    <span>Previous</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s + 1) as any)}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Continue to Step {step + 1}</span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Check size={16} strokeWidth={2.5} />
                    <span>Authorize & Issue Referral</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
