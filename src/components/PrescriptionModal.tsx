import React, { useState } from "react";
import { Patient, User, MedicationOrder } from "../types";
import {
  Pill,
  X,
  Check,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileText,
} from "./Icons";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  doctorUser: User;
  onAddMedication: (med: MedicationOrder) => void;
}

export default function PrescriptionModal({
  isOpen,
  onClose,
  patient,
  doctorUser,
  onAddMedication,
}: PrescriptionModalProps) {
  const [medName, setMedName] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("Oral (PO)");
  const [frequency, setFrequency] = useState("Once daily (OD) in the morning");
  const [quantity, setQuantity] = useState("30 tablets");
  const [instructions, setInstructions] = useState("Take after meals with a full glass of water.");
  const [isKonsultaCovered, setIsKonsultaCovered] = useState(true);
  const [isRefillable, setIsRefillable] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const quickCommonMeds = [
    { name: "Amlodipine Besylate", dose: "5mg Tablet", freq: "Once daily (OD) in morning" },
    { name: "Losartan Potassium", dose: "50mg Tablet", freq: "Once daily (OD) in morning" },
    { name: "Metformin HCl", dose: "500mg Tablet", freq: "Twice daily (BID) with meals" },
    { name: "Amoxicillin-Clavulanate", dose: "625mg Tablet", freq: "Twice daily (BID) x 7 days" },
    { name: "Paracetamol", dose: "500mg Tablet", freq: "Every 4–6 hrs PRN for fever/pain" },
  ];

  const handleSelectQuickMed = (med: { name: string; dose: string; freq: string }) => {
    setMedName(med.name);
    setDose(med.dose);
    setFrequency(med.freq);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !dose.trim()) return;

    const newMed: MedicationOrder = {
      id: `RX-2026-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.name,
      name: medName.trim(),
      dose: dose.trim(),
      route: route,
      freq: frequency.trim(),
      start: new Date().toISOString().split("T")[0],
      prescribedBy: doctorUser.name,
      prescribedByLicense: doctorUser.licenseNumber || "PRC Lic. Verified",
      status: "Active",
      refillable: isRefillable,
      notes: `${instructions} (${quantity}) ${isKonsultaCovered ? "[PhilHealth Konsulta Covered]" : ""}`,
    };

    onAddMedication(newMed);
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setMedName("");
      setDose("");
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Pill size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                CarePoint Clinical Workbench
              </div>
              <h2 className="text-base sm:text-lg font-bold">New e-Prescription (Rx)</h2>
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
        <div className="bg-indigo-50/70 px-5 py-2.5 border-b border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{patient.name}</span>
            <span className="text-indigo-700 font-mono bg-indigo-100/70 px-1.5 py-0.5 rounded font-semibold text-[10px]">
              {patient.id}
            </span>
            <span className="text-slate-500">• {patient.age} y/o {patient.gender}</span>
          </div>
          <div className="text-[11px] text-indigo-900 font-medium hidden sm:block">
            Prescriber: <span className="font-bold">{doctorUser.name}</span>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Prescription Issued</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Electronic prescription for <strong>{medName}</strong> has been transmitted and archived to the patient's active medication record.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Frequently Prescribed Formulations
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickCommonMeds.map((qm, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectQuickMed(qm)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {qm.name} {qm.dose}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medication Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Generic / Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  placeholder="e.g. Amlodipine Besylate or Losartan Potassium"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-semibold text-slate-900 focus:border-indigo-500 outline-hidden transition-colors"
                />
              </div>

              {/* Dosage & Route */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Dosage & Strength <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dose}
                    onChange={e => setDose(e.target.value)}
                    placeholder="e.g. 5mg Tablet or 500mg Cap"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium text-slate-900 focus:border-indigo-500 outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Administration Route</label>
                  <select
                    value={route}
                    onChange={e => setRoute(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 focus:border-indigo-500 outline-hidden"
                  >
                    <option value="Oral (PO)">Oral (PO)</option>
                    <option value="Intravenous (IV)">Intravenous (IV)</option>
                    <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                    <option value="Sublingual (SL)">Sublingual (SL)</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Topical">Topical</option>
                  </select>
                </div>
              </div>

              {/* Frequency & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Frequency / Sig</label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    placeholder="e.g. Once daily in the morning"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium text-slate-900 focus:border-indigo-500 outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dispense Quantity</label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="e.g. 30 tablets / 1 box"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium text-slate-900 focus:border-indigo-500 outline-hidden transition-colors"
                  />
                </div>
              </div>

              {/* Patient Instructions */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Special Dispensing & Patient Instructions</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Take after breakfast. Avoid grapefruit juice while on this medication."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium text-slate-900 focus:border-indigo-500 outline-hidden transition-colors"
                />
              </div>

              {/* Options / Badges */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isKonsultaCovered}
                    onChange={e => setIsKonsultaCovered(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-slate-800 font-medium">PhilHealth Konsulta Benefit Formulary</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRefillable}
                    onChange={e => setIsRefillable(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-slate-800 font-medium">Refillable (30 Days)</span>
                </label>
              </div>

              {/* Physician Signature Stamp */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    <span>Certified Physician: {doctorUser.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {doctorUser.licenseNumber || "PRC Lic. Verified"} • CarePoint OPD Prescribing Portal
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded uppercase">
                  Digital Rx Seal
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>Issue e-Prescription</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
