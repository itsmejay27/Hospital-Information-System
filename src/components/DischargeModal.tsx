import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { Patient, OpdDischarge } from "../types";
import {
  X,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Pill,
  Bed,
  ShieldCheck,
  Building2,
} from "./Icons";
import { uid, localDate } from "../services/ids";

interface DischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPatientId?: string;
}

export default function DischargeModal({
  isOpen,
  onClose,
  defaultPatientId,
}: DischargeModalProps) {
  const { user } = useAuth();
  const { patients, selectedPatient, dischargePatient } = useOpdData();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  // Start with the given patient, else the active patient, else the first one not yet discharged
  const firstChoice = () =>
    defaultPatientId ||
    (selectedPatient && selectedPatient.admissionStatus !== "Discharged" ? selectedPatient.id : "") ||
    patients.find(p => p.admissionStatus !== "Discharged")?.id ||
    "";
  const initialPatId = firstChoice();
  const [selectedPatId, setSelectedPatId] = useState<string>(initialPatId);

  // Step 1: Clinical Encounter Resolution
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [icd10Code, setIcd10Code] = useState("");
  const [clinicalResolution, setClinicalResolution] = useState("");

  // Step 2: Disposition Selection
  const [disposition, setDisposition] = useState<
    | "Treated & Sent Home"
    | "Admitted to Inpatient Ward"
    | "Transferred to Tertiary Center"
    | "Follow-up Scheduled"
    | "Discharged Against Medical Advice (DAMA/AMA)"
  >("Treated & Sent Home");
  const [bedReleaseConfirmed, setBedReleaseConfirmed] = useState(true);

  // Step 3: Home Instructions & Restriction Guidelines
  const [takeHomeMedications, setTakeHomeMedications] = useState("");
  const [homeInstructions, setHomeInstructions] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return localDate(d);
  });

  // Step 4: Physician Clearance Authorization & Bed Release
  const attendingDoctorName = user?.name || "";
  const attendingDoctorLicense = user?.licenseNumber || "";
  const [clearanceConfirmed, setClearanceConfirmed] = useState(false);
  const [condition, setCondition] = useState("Stable — vital signs within normal limits");
  const [stableConfirmed, setStableConfirmed] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  // Every time the dialog opens, start clean for the chosen patient (never reuse a previous patient's data)
  useEffect(() => {
    if (!isOpen) return;
    setSelectedPatId(firstChoice());
    setStep(1);
    setFinalDiagnosis("");
    setIcd10Code("");
    setClinicalResolution("");
    setDisposition("Treated & Sent Home");
    setBedReleaseConfirmed(true);
    setTakeHomeMedications("");
    setHomeInstructions("");
    setRedFlags("");
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setFollowUpDate(localDate(d));
    setClearanceConfirmed(false);
    setCondition("Stable — vital signs within normal limits");
    setStableConfirmed(false);
    setStepError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultPatientId]);

  if (!isOpen) return null;

  const currentPatient = patients.find(p => p.id === selectedPatId);
  const wasCritical = currentPatient?.triageTier === "critical" || currentPatient?.triageTier === "observation";
  const leavingHospital = disposition !== "Admitted to Inpatient Ward";

  /** Required fields of each step, checked before moving on. */
  const stepProblem = (s: number): string | null => {
    if (s === 1) {
      if (!currentPatient) return "Select the patient.";
      if (currentPatient.admissionStatus === "Discharged") return `${currentPatient.name} is already discharged.`;
      if (!finalDiagnosis.trim()) return "Enter the final diagnosis.";
      if (!clinicalResolution.trim()) return "Summarize the patient's response to treatment.";
    }
    if (s === 3 && leavingHospital && !homeInstructions.trim()) return "Enter the home care instructions.";
    if (s === 4) {
      if (!attendingDoctorName) return "Sign in as the attending doctor to clear a discharge.";
      if (leavingHospital && wasCritical && !stableConfirmed)
        return `${currentPatient?.name} is marked ${currentPatient?.triageTier?.toUpperCase()}. Confirm that the patient is now stable before discharging.`;
      if (!clearanceConfirmed) return "Tick the physician clearance confirmation.";
    }
    return null;
  };
  const goNext = () => {
    const problem = stepProblem(step);
    if (problem) return setStepError(problem);
    setStepError(null);
    setStep((step + 1) as 1 | 2 | 3 | 4);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const s of [1, 3, 4]) {
      const problem = stepProblem(s);
      if (problem) {
        setStepError(problem);
        setStep(s as 1 | 3 | 4);
        return;
      }
    }

    if (currentPatient) {
      const dischargeRecord: OpdDischarge = {
        id: `DC-${uid()}`,
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        disposition: disposition,
        dischargeDate: localDate(),
        followUpDate: followUpDate,
        clearedByDoctor: attendingDoctorLicense ? `${attendingDoctorName} (${attendingDoctorLicense})` : attendingDoctorName,
        instructions: [
          `${finalDiagnosis.trim()}${icd10Code.trim() ? ` (ICD-10: ${icd10Code.trim()})` : ""}.`,
          homeInstructions.trim() && `Instructions: ${homeInstructions.trim()}`,
          redFlags.trim() && `Warning signs: ${redFlags.trim()}`,
          takeHomeMedications.trim() && `Rx: ${takeHomeMedications.trim()}`,
        ]
          .filter(Boolean)
          .join(" "),
        attendingDoctor: attendingDoctorLicense ? `${attendingDoctorName} (${attendingDoctorLicense})` : attendingDoctorName,
        dischargeSummary: `${clinicalResolution.trim()} Disposition: ${disposition}.`,
        dischargeMeds: takeHomeMedications.split(/[;\n]/).map(m => m.trim()).filter(Boolean),
        conditionAtDischarge: leavingHospital ? condition : undefined,
      };
      // Saves the record, sets the patient Discharged + Stable, frees the bed and records the history
      dischargePatient(dischargeRecord);
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
              <CheckCircle2 size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="font-serif font-bold text-base text-white flex items-center gap-2">
                <span>Patient Discharge Protocol</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-full font-mono">
                  4-STEP CLEARANCE
                </span>
              </div>
              <div className="text-[11px] text-teal-300/90 font-medium">
                CarePoint Medical Center • Clinical Encounter Resolution & Bed Release
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
            <span className="whitespace-nowrap">Resolution & Diag</span>
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
            <span className="whitespace-nowrap">Disposition</span>
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
            <span className="whitespace-nowrap">Home Instructions</span>
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
            <span className="whitespace-nowrap">Clearance Sign-off</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {submittedSuccessfully ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Patient Discharged & Bed Released</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Official clinical discharge summary for <strong>{currentPatient?.name}</strong> has been executed. Hospital bed status updated to available.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ============================================================ */}
              {/* STEP 1: CLINICAL ENCOUNTER RESOLUTION */}
              {/* ============================================================ */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Select Patient for Discharge
                    </label>
                    <select
                      value={selectedPatId}
                      onChange={e => setSelectedPatId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:border-teal-500 outline-hidden"
                    >
                      {patients
                        .filter(p => p.admissionStatus !== "Discharged" || p.id === selectedPatId)
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.id}) — {p.age}y/o {p.gender} • {p.admissionStatus} • {p.triageTier}
                          </option>
                        ))}
                    </select>

                    {currentPatient && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">MRN Number:</span>
                          <strong className="text-slate-800 font-mono">{currentPatient.id}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Bed / Location:</span>
                          <strong className="text-slate-800">{currentPatient.ward || "OPD"}{currentPatient.bed ? ` • ${currentPatient.bed}` : ""}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Allergies:</span>
                          <strong className="text-rose-700 truncate block">{currentPatient.allergies.join(", ") || "None recorded"}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Current Status:</span>
                          <span className="inline-block px-1.5 py-0.5 rounded font-bold uppercase text-[9px] bg-teal-100 text-teal-800">
                            {currentPatient.admissionStatus}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Final Clinical Diagnosis <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={finalDiagnosis}
                        onChange={e => setFinalDiagnosis(e.target.value)}
                        placeholder="e.g. Acute Bronchitis, Resolving; Stage 1 Hypertension"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-semibold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        ICD-10 Code(s)
                      </label>
                      <input
                        type="text"
                        value={icd10Code}
                        onChange={e => setIcd10Code(e.target.value)}
                        placeholder="e.g. J20.9, I10"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Clinical Encounter Resolution Narrative <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={clinicalResolution}
                      onChange={e => setClinicalResolution(e.target.value)}
                      placeholder="Summarize the patient's clinical response to treatment, final stable vitals, and reasons for discharge clearance..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 2: DISPOSITION SELECTION */}
              {/* ============================================================ */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block font-bold text-slate-700 mb-2">
                      Patient Clinical Disposition <span className="text-rose-500">*</span>
                    </label>
                    <div className="space-y-2.5">
                      {[
                        {
                          id: "Treated & Sent Home",
                          title: "Treated & Sent Home (Routine Discharge)",
                          desc: "Patient has clinically improved, vital signs are stable, and outpatient management is sufficient.",
                          badge: "bg-emerald-100 text-emerald-800",
                        },
                        {
                          id: "Follow-up Scheduled",
                          title: "Follow-up Scheduled (OPD Subspecialty)",
                          desc: "Discharged from current encounter with a scheduled follow-up consult within 7–14 days.",
                          badge: "bg-blue-100 text-blue-800",
                        },
                        {
                          id: "Admitted to Inpatient Ward",
                          title: "Admitted to Inpatient Ward / Intermediate Care",
                          desc: "Requires step-up continuous bedside inpatient monitoring and IV medication regimen.",
                          badge: "bg-amber-100 text-amber-800",
                        },
                        {
                          id: "Transferred to Tertiary Center",
                          title: "Transferred to Tertiary Care Center",
                          desc: "Requires subspecialty surgical or interventional care beyond outpatient facility scope.",
                          badge: "bg-purple-100 text-purple-800",
                        },
                        {
                          id: "Discharged Against Medical Advice (DAMA/AMA)",
                          title: "Discharged Against Medical Advice (DAMA / AMA)",
                          desc: "Patient or legal guardian refuses further medical care contrary to clinical advice; waiver signed.",
                          badge: "bg-rose-100 text-rose-800",
                        },
                      ].map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDisposition(d.id as any)}
                          className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            disposition === d.id
                              ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-200"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{d.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{d.desc}</div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${d.badge}`}>
                            {d.id.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bed Release Notice */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bedReleaseConfirmed}
                      onChange={e => setBedReleaseConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 shrink-0"
                    />
                    <div className="text-[11px] text-slate-700">
                      <strong className="text-slate-900">Immediate Bed Release Authorization:</strong> Mark assigned bed ({currentPatient?.bed || "OPD Stretcher"}) as vacant and notify environmental housekeeping for terminal disinfection.
                    </div>
                  </label>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 3: HOME INSTRUCTIONS & RESTRICTIONS */}
              {/* ============================================================ */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Pill size={14} className="text-teal-600" />
                      <span>Take-Home Medications & Prescription Schedule (Rx)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={takeHomeMedications}
                      onChange={e => setTakeHomeMedications(e.target.value)}
                      placeholder="Medication name, dosage, frequency, and duration..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden text-slate-800 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Home Care Guidelines, Hydration & Activity Restrictions <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={homeInstructions}
                      onChange={e => setHomeInstructions(e.target.value)}
                      placeholder="Instructions on wound dressing, diet, physical activity limitations, and rest..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-rose-700 mb-1 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-rose-600" />
                      <span>Emergency Warning Signs / Red Flags Requiring Immediate Hospital Return</span>
                    </label>
                    <textarea
                      rows={2}
                      value={redFlags}
                      onChange={e => setRedFlags(e.target.value)}
                      placeholder="Symptoms that warrant emergency room return..."
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/40 focus:border-rose-500 outline-hidden text-rose-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Calendar size={14} className="text-teal-600" />
                      <span>Scheduled Follow-up Clinic Consultation Date</span>
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 outline-hidden font-medium text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 4: PHYSICIAN CLEARANCE AUTHORIZATION */}
              {/* ============================================================ */}
              {step === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Summary Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>Discharge Authorization Summary</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {disposition}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Patient Name:</span>
                        <strong className="text-slate-800">{currentPatient?.name} ({currentPatient?.id})</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Diagnosis:</span>
                        <strong className="text-slate-800">{finalDiagnosis}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Follow-up Date:</span>
                        <strong className="text-teal-700">{followUpDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Bed Release:</span>
                        <strong className="text-slate-800">{bedReleaseConfirmed ? "Immediate Release" : "Hold"}</strong>
                      </div>
                    </div>
                  </div>

                  {leavingHospital && (
                    <div className={`rounded-xl p-3.5 border space-y-2 ${wasCritical ? "bg-rose-50 border-rose-300" : "bg-slate-50 border-slate-200"}`}>
                      <label className="block font-bold text-slate-700">Condition at discharge *</label>
                      <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold">
                        <option>Stable — vital signs within normal limits</option>
                        <option>Improved — stable, needs follow-up</option>
                        <option>Recovered</option>
                        <option>Stable for transfer to another facility</option>
                        <option>Against medical advice — condition explained to patient</option>
                      </select>
                      {wasCritical && (
                        <label className="flex items-start gap-2 text-[11px] text-rose-900 font-semibold cursor-pointer">
                          <input type="checkbox" checked={stableConfirmed} onChange={e => setStableConfirmed(e.target.checked)} className="mt-0.5 shrink-0" />
                          <span>
                            {currentPatient?.name} is currently marked <b className="uppercase">{currentPatient?.triageTier}</b>. I re-assessed the patient
                            and confirm the condition is now stable for discharge. The status will change to <b>STABLE</b> for doctors and the front desk.
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  <div className="rounded-xl p-3 border border-slate-200 bg-white text-[11px]">
                    <span className="text-slate-500">Cleared and signed by:</span>{" "}
                    <strong className="text-slate-900">
                      {attendingDoctorName || "—"}
                      {attendingDoctorLicense ? ` (${attendingDoctorLicense})` : ""}
                    </strong>
                  </div>

                  {/* Digital Signature Confirmation */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-teal-200 bg-teal-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearanceConfirmed}
                      onChange={e => setClearanceConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 shrink-0"
                    />
                    <span className="text-[11px] text-teal-900 leading-relaxed">
                      I certify as the attending medical physician that the patient has met all clinical criteria for discharge. Home instructions and emergency red flag warnings have been fully explained to the patient / designated relative.
                    </span>
                  </label>
                </div>
              )}

              {stepError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{stepError}</div>
              )}
              {/* Step Navigation Controls */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setStep((step - 1) as 1 | 2 | 3 | 4);
                    }}
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
                    onClick={goNext}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Step {step + 1}</span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!clearanceConfirmed}
                    title={!clearanceConfirmed ? "Tick the physician clearance confirmation first" : undefined}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                    <span>Authorize Physician Clearance & Release Bed</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center shrink-0">
          CarePoint Medical Center • Physician Clearance & Hospital Bed Logistics
        </div>
      </div>
    </div>
  );
}
