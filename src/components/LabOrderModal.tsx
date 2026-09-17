import React, { useState } from "react";
import { Patient, User, DiagnosticResult } from "../types";
import {
  FlaskConical,
  X,
  Check,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "./Icons";

interface LabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  doctorUser: User;
  onAddLabResult: (result: DiagnosticResult) => void;
}

export default function LabOrderModal({
  isOpen,
  onClose,
  patient,
  doctorUser,
  onAddLabResult,
}: LabOrderModalProps) {
  const [testName, setTestName] = useState("12-Lead Electrocardiogram (ECG)");
  const [category, setCategory] = useState<DiagnosticResult["category"]>("Cardiology");
  const [specimen, setSpecimen] = useState("Surface Electrode Tracing");
  const [priority, setPriority] = useState<"Routine" | "Urgent" | "Stat Emergency">("Routine");
  const [clinicalIndication, setClinicalIndication] = useState("Baseline cardiac evaluation for stage 1 hypertension");
  const [specialInstructions, setSpecialInstructions] = useState("Fast 8–10 hours prior if lipid profile/FBS requested.");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const quickCommonTests = [
    { name: "12-Lead Electrocardiogram (ECG)", cat: "Cardiology" as const, spec: "Surface Electrode Tracing" },
    { name: "Complete Blood Count (CBC) with Platelets", cat: "Hematology" as const, spec: "Venous Whole Blood (EDTA)" },
    { name: "Fasting Blood Sugar (FBS)", cat: "Clinical Chemistry" as const, spec: "Serum / Fluoride" },
    { name: "Lipid Profile (Total Chol, HDL, LDL, Trig)", cat: "Clinical Chemistry" as const, spec: "Serum" },
    { name: "Serum Creatinine & eGFR", cat: "Clinical Chemistry" as const, spec: "Serum" },
    { name: "Chest X-Ray (PA View)", cat: "Radiology" as const, spec: "Digital Radiography" },
    { name: "Urinalysis with Microscopic Exam", cat: "Clinical Chemistry" as const, spec: "Clean-catch Midstream Urine" },
  ];

  const handleSelectQuickTest = (t: { name: string; cat: DiagnosticResult["category"]; spec: string }) => {
    setTestName(t.name);
    setCategory(t.cat);
    setSpecimen(t.spec);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    const newLab: DiagnosticResult = {
      id: `LAB-2026-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.name,
      test: testName.trim(),
      category: category,
      date: new Date().toISOString().split("T")[0],
      status: "In-Progress",
      specimenType: specimen.trim() || "Clinical Specimen",
      orderingPhysician: doctorUser.name,
      orderingPhysicianLicense: doctorUser.licenseNumber || "PRC-MD-AUTH",
      releasedBy: "Central Diagnostic Pathology & Imaging",
      summary: `${clinicalIndication} • Priority: ${priority}`,
      items: [
        {
          name: testName.trim(),
          value: "Specimen Queued",
          ref: "Standard Laboratory Range",
          flag: null,
          unit: "Assay Pending",
        },
      ],
    };

    onAddLabResult(newLab);
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-amber-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <FlaskConical size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Central Diagnostic Laboratory & Imaging
              </div>
              <h2 className="text-base sm:text-lg font-bold">Order Diagnostic / Pathology Test</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Patient Context Strip */}
        <div className="bg-amber-50/70 px-5 py-2.5 border-b border-amber-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{patient.name}</span>
            <span className="text-amber-800 font-mono bg-amber-100/70 px-1.5 py-0.5 rounded font-semibold text-[10px]">
              {patient.id}
            </span>
            <span className="text-slate-500">• {patient.age} y/o {patient.gender}</span>
          </div>
          <div className="text-[11px] text-amber-900 font-medium hidden sm:block">
            Ordering MD: <span className="font-bold">{doctorUser.name}</span>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Diagnostic Order Dispatched</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Laboratory order for <strong>{testName}</strong> has been transmitted directly to Central Diagnostic Pathology queue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Frequently Ordered Diagnostic Panels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickCommonTests.map((qt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectQuickTest(qt)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {qt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Test / Diagnostic Procedure <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="e.g. 12-Lead Electrocardiogram, Complete Blood Count"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-semibold text-slate-900 focus:border-amber-500 outline-hidden transition-colors"
                />
              </div>

              {/* Category & Specimen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Diagnostic Discipline / Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as DiagnosticResult["category"])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 focus:border-amber-500 outline-hidden"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Clinical Chemistry">Clinical Chemistry</option>
                    <option value="Radiology">Radiology & Imaging</option>
                    <option value="Microbiology">Microbiology & Serology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Specimen / Acquisition Method</label>
                  <input
                    type="text"
                    value={specimen}
                    onChange={e => setSpecimen(e.target.value)}
                    placeholder="e.g. Venous Blood, Surface Electrodes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium text-slate-900 focus:border-amber-500 outline-hidden transition-colors"
                  />
                </div>
              </div>

              {/* Priority Tier */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Priority / Turnaround Urgency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Routine", "Urgent", "Stat Emergency"] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        priority === p
                          ? p === "Stat Emergency"
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : p === "Urgent"
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Indication */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Clinical Indication / Diagnostic Question</label>
                <textarea
                  rows={2}
                  value={clinicalIndication}
                  onChange={e => setClinicalIndication(e.target.value)}
                  placeholder="e.g. Screen for end-organ damage or check glycemic control..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium text-slate-900 focus:border-amber-500 outline-hidden transition-colors"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Patient Preparation & Phlebotomy Notes</label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Fast 10 hrs, no morning dose of insulin..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium text-slate-900 focus:border-amber-500 outline-hidden transition-colors"
                />
              </div>

              {/* Physician Certification Stamp */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-amber-600" />
                    <span>Authorized Ordering MD: {doctorUser.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {doctorUser.licenseNumber || "PRC Lic. Verified"} • Central Pathology LIS Interface
                  </div>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase">
                  Lab Order Dispatch
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>Transmit Diagnostic Order</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
