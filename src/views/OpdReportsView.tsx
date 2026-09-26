import React, { useState } from "react";
import { Patient, PhilHealthClaim, HospitalConfig } from "../types";
import {
  PieChart,
  Printer,
  Calendar,
  Filter,
  CheckCircle,
  Activity,
  CreditCard,
  Download,
  Users,
  Clock,
} from "../components/Icons";

interface OpdReportsViewProps {
  patients: Patient[];
  claims: PhilHealthClaim[];
  hospitalConfig: HospitalConfig;
}

export default function OpdReportsView({
  patients,
  claims,
  hospitalConfig,
}: OpdReportsViewProps) {
  const [reportPeriod, setReportPeriod] = useState("Today");

  // Mock analytics aggregates
  const totalPatientsToday = 23;
  const femalePatients = 14;
  const malePatients = 9;
  const seniorPatients = 7;
  const pediatricPatients = 4;

  const topDiagnoses = [
    { icd: "I10", name: "Essential Hypertension", count: 8, percentage: 35 },
    { icd: "A09", name: "Acute Gastroenteritis & Colitis", count: 5, percentage: 22 },
    { icd: "J06.9", name: "Acute Upper Respiratory Infection", count: 4, percentage: 17 },
    { icd: "E11.9", name: "Type 2 Diabetes Mellitus", count: 3, percentage: 13 },
    { icd: "K35.80", name: "Acute Appendicitis (Pre-Op)", count: 2, percentage: 9 },
    { icd: "M54.5", name: "Low Back Pain (Musculoskeletal)", count: 1, percentage: 4 },
  ];

  const totalPhilHealthBilled = claims.reduce((a, b) => a + b.hospitalCharges, 0);
  const totalPhilHealthReimbursed = claims.reduce((a, b) => a + b.philhealthBenefit, 0);
  const totalPatientPaid = claims.reduce((a, b) => a + b.patientPayable, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner (Medzone Hospital Emerald Theme) */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-emerald-500/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              Departmental Analytics • DOH FHSIS
            </span>
            <span className="text-xs text-emerald-200/80 font-mono">/reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <PieChart size={28} className="text-emerald-300" />
            <span>OPD Census & Morbidity Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Departmental clinical reporting, ICD-10 epidemiology statistics, and Universal Health Care metrics.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <select
            value={reportPeriod}
            onChange={e => setReportPeriod(e.target.value)}
            className="bg-white/10 border border-white/20 text-white font-semibold rounded-full px-4 py-2 text-xs focus:outline-hidden backdrop-blur-xs cursor-pointer"
          >
            <option value="Today" className="text-slate-900 bg-white">Today (Sep 15, 2026)</option>
            <option value="This Week" className="text-slate-900 bg-white">This Week (Sep 10 - 15)</option>
            <option value="This Month" className="text-slate-900 bg-white">This Month (September 2026)</option>
            <option value="Quarterly" className="text-slate-900 bg-white">Q3 2026</option>
          </select>

          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-full bg-white text-slate-900 font-bold text-xs shadow-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
          >
            <Printer size={15} strokeWidth={2} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 4 High-Level Aggregate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Consultations</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalPatientsToday}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {femalePatients} Females • {malePatients} Males
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm shadow-inner">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700">PhilHealth Covered</span>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1 font-mono">
              ₱{totalPhilHealthReimbursed.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">
              {claims.length} claims submitted
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-inner">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-700">Priority Lane (PWD/Sr)</span>
            <div className="text-2xl font-extrabold text-blue-900 mt-1">{seniorPatients}</div>
            <span className="text-[10px] text-blue-600 mt-0.5 block">
              30.4% Priority lane ratio
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm shadow-inner">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700">Patient Copay</span>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1 font-mono">
              ₱{totalPatientPaid.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">
              100% Cashier cleared
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-inner">
            ₱
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top ICD-10 Morbidities & Triage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top 6 ICD-10 OPD Morbidities */}
        <div className="bg-white rounded-3xl border border-slate-100/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Leading Causes of Morbidity (ICD-10)
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-0.5 rounded-full">
              DOH FHSIS Form
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">#</th>
                <th className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">ICD-10</th>
                <th className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Diagnosis</th>
                <th className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Cases</th>
                <th className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-40">Share</th>
              </tr>
            </thead>
            <tbody>
              {topDiagnoses.map((item, i) => (
                <tr key={item.icd} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                  <td className="px-2.5 py-2 text-slate-400 font-bold">{i + 1}</td>
                  <td className="px-2.5 py-2 font-mono font-bold text-emerald-700">{item.icd}</td>
                  <td className="px-2.5 py-2 font-semibold text-slate-800">{item.name}</td>
                  <td className="px-2.5 py-2 font-mono font-bold text-slate-900 text-right">{item.count}</td>
                  <td className="px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                      <span className="font-mono text-slate-500 w-9 text-right">{item.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Hospital Financial & Demographics Summary */}
        <div className="bg-white rounded-3xl border border-slate-100/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Financial & PhilHealth Utilization Breakdown
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full">
              PhilHealth CF-2
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-600">Gross Outpatient Charges</span>
              <span className="font-mono font-bold text-slate-900">
                ₱{totalPhilHealthBilled.toLocaleString()}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-emerald-700">
              <span className="font-semibold">PhilHealth Benefit Share (Covered)</span>
              <span className="font-mono font-bold">
                ₱{totalPhilHealthReimbursed.toLocaleString()} (
                {Math.round((totalPhilHealthReimbursed / (totalPhilHealthBilled || 1)) * 100)}%)
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-slate-700">
              <span className="text-slate-600">Patient Direct Out-of-Pocket Copay</span>
              <span className="font-mono font-bold">
                ₱{totalPatientPaid.toLocaleString()}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-slate-600">
              <span>Average Consultation Turnaround Time</span>
              <span className="font-mono font-bold text-slate-800">14.2 minutes</span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-slate-600">
              <span>Prescription Fulfillment Rate</span>
              <span className="font-mono font-bold text-emerald-700">98.5% (Hospital Pharmacy)</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-[11px] text-slate-700 space-y-1">
            <div className="font-bold text-emerald-950">Hospital Accreditation Certification:</div>
            <div>{hospitalConfig.accreditation}</div>
            <div className="text-[10px] text-slate-500">
              Report certified by Head of Medical Records & DPO Office
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
