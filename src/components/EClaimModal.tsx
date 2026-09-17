import React, { useState } from "react";
import { Patient, User, PhilHealthClaim } from "../types";
import {
  CreditCard,
  X,
  Check,
  ShieldCheck,
  FileCheck,
  AlertCircle,
} from "./Icons";

interface EClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  doctorUser: User;
  onAddClaim?: (claim: PhilHealthClaim) => void;
}

export default function EClaimModal({
  isOpen,
  onClose,
  patient,
  doctorUser,
  onAddClaim,
}: EClaimModalProps) {
  const [pin, setPin] = useState(patient.philhealth?.pin || "12-345678901-2");
  const [membershipType, setMembershipType] = useState(
    patient.philhealth?.category || "Direct Contributor - Employed"
  );
  const [diagnosisIcd, setDiagnosisIcd] = useState("I10 - Essential (primary) hypertension");
  const [caseRateLabel, setCaseRateLabel] = useState("PhilHealth Konsulta Outpatient Package (Php 1,700)");
  const [hospitalCharges, setHospitalCharges] = useState(3500);
  const [philhealthBenefit, setPhilhealthBenefit] = useState(2500);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const patientPayable = Math.max(0, hospitalCharges - philhealthBenefit);

  const commonCaseRates = [
    { label: "PhilHealth Konsulta Outpatient Package (Php 1,700)", charge: 2200, benefit: 1700 },
    { label: "Hypertension Stage 1/2 Medical Management (Php 6,000)", charge: 6500, benefit: 6000 },
    { label: "Acute Bronchitis / URTI Case Rate (Php 5,500)", charge: 5800, benefit: 5500 },
    { label: "Type 2 Diabetes Medical Care (Php 7,000)", charge: 8200, benefit: 7000 },
  ];

  const handleSelectCaseRate = (rate: { label: string; charge: number; benefit: number }) => {
    setCaseRateLabel(rate.label);
    setHospitalCharges(rate.charge);
    setPhilhealthBenefit(rate.benefit);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newClaim: PhilHealthClaim = {
      id: `CLM-2026-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      pin: pin.trim(),
      memberName: patient.name,
      membershipType: membershipType,
      diagnosisWithIcd: diagnosisIcd,
      caseRateAmount: caseRateLabel,
      claimStatus: "Transmitted",
      submissionDate: new Date().toISOString().split("T")[0],
      hospitalCharges: hospitalCharges,
      philhealthBenefit: philhealthBenefit,
      patientPayable: patientPayable,
    };

    if (onAddClaim) {
      onAddClaim(newClaim);
    }

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
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <CreditCard size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                PhilHealth eClaims • Claim Form 2 (CF2)
              </div>
              <h2 className="text-base sm:text-lg font-bold">Transmit PhilHealth eClaim</h2>
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
        <div className="bg-emerald-50/70 px-5 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{patient.name}</span>
            <span className="text-emerald-800 font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded font-semibold text-[10px]">
              {patient.id}
            </span>
            <span className="text-slate-500">• {patient.age} y/o {patient.gender}</span>
          </div>
          <div className="text-[11px] text-emerald-900 font-medium hidden sm:block">
            Attending Physician: <span className="font-bold">{doctorUser.name}</span>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-bold text-slate-900">eClaim Transmitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                PhilHealth Claim Form 2 (CF2) for <strong>{patient.name}</strong> has been transmitted to the PhilHealth eClaims server with status <strong>Transmitted</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Case Rate Packages */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Standard Case Rate / Benefit Packages
                </label>
                <div className="space-y-1.5">
                  {commonCaseRates.map((cr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectCaseRate(cr)}
                      className={`w-full text-left p-2 rounded-xl border text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                        caseRateLabel === cr.label
                          ? "bg-emerald-50 text-emerald-900 border-emerald-400 font-semibold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{cr.label}</span>
                      <span className="font-mono font-bold text-emerald-700 shrink-0 ml-2">
                        Covered: ₱{cr.benefit.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PhilHealth PIN & Member Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    PhilHealth Identification No. (PIN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="XX-XXXXXXXXX-X"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-mono text-slate-900 font-semibold focus:border-emerald-500 outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Membership Category</label>
                  <select
                    value={membershipType}
                    onChange={e => setMembershipType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 focus:border-emerald-500 outline-hidden"
                  >
                    <option value="Direct Contributor (Employed)">Direct Contributor (Employed)</option>
                    <option value="Direct Contributor (Self-Employed)">Direct Contributor (Self-Employed)</option>
                    <option value="Indirect Contributor (Indigent/NHTS)">Indirect Contributor (Indigent/NHTS)</option>
                    <option value="Senior Citizen (RA 10645)">Senior Citizen (RA 10645)</option>
                    <option value="Lifetime Member">Lifetime Member</option>
                  </select>
                </div>
              </div>

              {/* Primary ICD-10 Diagnosis */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Primary ICD-10 Clinical Diagnosis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={diagnosisIcd}
                  onChange={e => setDiagnosisIcd(e.target.value)}
                  placeholder="e.g. I10 - Essential (primary) hypertension"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium text-slate-900 focus:border-emerald-500 outline-hidden transition-colors"
                />
              </div>

              {/* Financial Computation Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Benefit Computation Breakdown
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500">Total Charges</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      ₱{hospitalCharges.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-800 font-semibold">PhilHealth Benefit</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">
                      ₱{philhealthBenefit.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500">Patient Payable</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      ₱{patientPayable.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Physician Accreditation Stamp */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    <span>Certified Attending: {doctorUser.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {doctorUser.licenseNumber || "PRC Lic. Verified"} • PhilHealth Accreditation #HOSP-NCR-2026
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                  CF2 Signed
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>Transmit eClaim to PhilHealth</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
