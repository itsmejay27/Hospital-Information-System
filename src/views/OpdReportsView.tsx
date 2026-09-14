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
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
            <PieChart size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              OPD Census, Morbidity & Claims Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Departmental clinical reporting, ICD-10 epidemiology, and DOH statistical census
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={reportPeriod}
            onChange={e => setReportPeriod(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500"
          >
            <option value="Today">Today (Sep 15, 2026)</option>
            <option value="This Week">This Week (Sep 10 - 15)</option>
            <option value="This Month">This Month (September 2026)</option>
            <option value="Quarterly">Q3 2026</option>
          </select>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer size={14} strokeWidth={2} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 4 High-Level Aggregate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Total OPD Consultations
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalPatientsToday}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {femalePatients} Females • {malePatients} Males
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wide">
            PhilHealth Benefit Total
          </span>
          <div className="text-2xl font-bold text-teal-800 mt-1 font-mono">
            ₱{totalPhilHealthReimbursed.toLocaleString()}
          </div>
          <div className="text-[10px] text-teal-600 mt-1">
            {claims.length} claims submitted
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
            Senior & PWD Consults
          </span>
          <div className="text-2xl font-bold text-blue-900 mt-1">{seniorPatients}</div>
          <div className="text-[10px] text-blue-600 mt-1">
            30.4% Priority lane ratio
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
            Patient Copay Collected
          </span>
          <div className="text-2xl font-bold text-emerald-900 mt-1 font-mono">
            ₱{totalPatientPaid.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">
            100% Cashier cleared
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top ICD-10 Morbidities & Triage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Top 6 ICD-10 OPD Morbidities */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Leading OPD Causes of Morbidity (ICD-10)
            </h3>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-mono font-semibold px-2 py-0.5 rounded">
              DOH FHSIS Form
            </span>
          </div>

          <div className="space-y-3">
            {topDiagnoses.map(item => (
              <div key={item.icd} className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">
                    <span className="font-mono font-bold text-teal-700 mr-1.5">[{item.icd}]</span>
                    {item.name}
                  </span>
                  <span className="font-mono text-slate-500 font-semibold">
                    {item.count} cases ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage * 2}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Hospital Financial & Demographics Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Financial & PhilHealth Utilization Breakdown
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
              PhilHealth CF-2 Summary
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-600">Gross Outpatient Charges</span>
              <span className="font-mono font-semibold text-slate-900">
                ₱{totalPhilHealthBilled.toLocaleString()}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-teal-700">
              <span>PhilHealth Benefit Share (Covered)</span>
              <span className="font-mono font-bold">
                ₱{totalPhilHealthReimbursed.toLocaleString()} (
                {Math.round((totalPhilHealthReimbursed / (totalPhilHealthBilled || 1)) * 100)}%)
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-slate-700">
              <span>Patient Direct Out-of-Pocket Copay</span>
              <span className="font-mono font-semibold">
                ₱{totalPatientPaid.toLocaleString()}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-slate-600">
              <span>Average Consultation Turnaround Time</span>
              <span className="font-mono font-semibold text-slate-800">14.2 minutes</span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-slate-600">
              <span>Prescription Fulfillment Rate</span>
              <span className="font-mono font-semibold text-emerald-700">98.5% (Hospital Pharmacy)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Hospital Accreditation Certification:</div>
            <div>{hospitalConfig.accreditation}</div>
            <div className="text-[10px] text-slate-400">
              Report certified by Head of Medical Records & DPO Office
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
