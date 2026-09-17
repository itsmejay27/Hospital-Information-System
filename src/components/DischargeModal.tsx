import React, { useState } from "react";
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
} from "./Icons";

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
  const { patients, selectedPatient, addDischarge, updatePatientAdmissionStatus } = useOpdData();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const initialPatId = defaultPatientId || selectedPatient?.id || patients[0]?.id || "";
  const [selectedPatId, setSelectedPatId] = useState<string>(initialPatId);
  const [disposition, setDisposition] = useState<
    | "Routine Discharge / Recovered"
    | "Transferred to Inpatient Ward"
    | "Discharged Against Medical Advice (DAMA/AMA)"
    | "Referred to Tertiary Care"
  >("Routine Discharge / Recovered");
  const [finalDiagnosis, setFinalDiagnosis] = useState("Acute Bronchitis, Resolving; Stage 1 Essential Hypertension controlled.");
  const [homeInstructions, setHomeInstructions] = useState("Complete oral antibiotic course as prescribed. Hydrate adequately with 2–3L fluids daily. Avoid strenuous activities for 5 days.");
  const [takeHomeMedications, setTakeHomeMedications] = useState("Amoxicillin-Clavulanate 625mg PO BID x 5 days; Losartan Potassium 50mg PO OD in AM; Paracetamol 500mg PO PRN fever/pain.");
  const [redFlags, setRedFlags] = useState("High fever >38.5°C, hemoptysis (coughing blood), shortness of breath, or chest heaviness.");
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [attendingDoctorName, setAttendingDoctorName] = useState(user?.name || "Dr. Mark Arkiel Jacobe, MD");
  const [attendingDoctorLicense, setAttendingDoctorLicense] = useState(user?.licenseNumber || "PRC Lic. #0089201");
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  if (!isOpen) return null;

  const currentPatient = patients.find(p => p.id === selectedPatId) || patients[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentPatient) {
      // Update patient status to Discharged
      if (updatePatientAdmissionStatus) {
        updatePatientAdmissionStatus(currentPatient.id, "Discharged");
      }

      const dischargeRecord: OpdDischarge = {
        id: `DC-2026-${Date.now().toString().slice(-4)}`,
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        disposition: disposition,
        dischargeDate: new Date().toISOString().split("T")[0],
        followUpDate: followUpDate,
        clearedByDoctor: `${attendingDoctorName} (${attendingDoctorLicense})`,
        instructions: `${finalDiagnosis}. Instructions: ${homeInstructions}. Rx: ${takeHomeMedications}`,
        attendingDoctor: `${attendingDoctorName} (${attendingDoctorLicense})`,
        dischargeSummary: `${finalDiagnosis}. Instructions: ${homeInstructions}. Rx: ${takeHomeMedications}`,
        dischargeMeds: takeHomeMedications.split(";").map(m => m.trim()),
      };

      if (addDischarge) {
        addDischarge(dischargeRecord);
      }
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
              <FileCheck size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="font-serif font-bold text-base text-white">
                Patient Discharge & Clearance Order
              </div>
              <div className="text-[11px] text-teal-300">
                CarePoint Medical Center • Multi-Step Clinical Sign-off & Prescriptions
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
              Patient & Disposition
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
              Home Rx & Advice
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
              Follow-up & Sign-off
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
              <h3 className="text-base font-bold text-slate-900">Discharge Authorized</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Patient <strong>{currentPatient?.name}</strong> has been marked as discharged. Clinical instructions and take-home medications have been archived.
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
                          {p.name} ({p.id}) — {p.admissionStatus} • {p.ward || "OPD"} [{p.triageTier.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Discharge Disposition *
                    </label>
                    <select
                      value={disposition}
                      onChange={(e) => setDisposition(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-medium"
                    >
                      <option value="Routine Discharge / Recovered">
                        Routine Discharge / Recovered & Clinically Stable
                      </option>
                      <option value="Transferred to Inpatient Ward">
                        Transferred to Inpatient Ward for Further Workup
                      </option>
                      <option value="Referred to Tertiary Care">
                        Referred to External Specialty Tertiary Hospital
                      </option>
                      <option value="Discharged Against Medical Advice (DAMA/AMA)">
                        Discharged Against Medical Advice (DAMA / AMA)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Final Discharge Diagnosis & ICD-10 Coding *
                    </label>
                    <input
                      type="text"
                      required
                      value={finalDiagnosis}
                      onChange={(e) => setFinalDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Bronchitis - ICD-10: J20.9"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-medium"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Take-Home Prescriptions & Dosage Schedule *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={takeHomeMedications}
                      onChange={(e) => setTakeHomeMedications(e.target.value)}
                      placeholder="Medication name, dosage, frequency, route, duration..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-teal-500 outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Dietary & Activity Post-Discharge Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={homeInstructions}
                      onChange={(e) => setHomeInstructions(e.target.value)}
                      placeholder="Diet recommendations, wound care, physical restrictions..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Warning Signs / Emergency Return Criteria
                    </label>
                    <input
                      type="text"
                      value={redFlags}
                      onChange={(e) => setRedFlags(e.target.value)}
                      placeholder="Seek immediate ER care if..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Scheduled Follow-up Consultation Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Attending Physician Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={attendingDoctorName}
                        onChange={(e) => setAttendingDoctorName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        PRC License Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={attendingDoctorLicense}
                        onChange={(e) => setAttendingDoctorLicense(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-teal-500 outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                    <div className="font-bold text-slate-900">Summary Review</div>
                    <div className="text-slate-600">
                      Discharging: <strong>{currentPatient?.name}</strong> • Disposition: <strong>{disposition}</strong>
                    </div>
                    <div className="text-slate-600">
                      Follow-up Clinic Return: <strong>{followUpDate}</strong>
                    </div>
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
                    <span>Authorize Discharge & Print Orders</span>
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
