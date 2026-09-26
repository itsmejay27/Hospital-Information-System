import React from "react";
import { Patient } from "../types";

const triageStyle: Record<string, string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  observation: "bg-amber-50 text-amber-700 border-amber-200",
  stable: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface PatientInfoBarProps {
  patient: Patient;
  /** Extra label/value pairs shown after the standard fields. */
  extra?: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
}

/** Standard patient header: key facts in one bordered row, like a chart banner. */
export default function PatientInfoBar({ patient, extra = [], actions }: PatientInfoBarProps) {
  const allergies = patient.allergies?.filter(a => a && !/^none/i.test(a)) ?? [];
  const fields: { label: string; value: React.ReactNode; wide?: boolean }[] = [
    { label: "Age / Sex", value: `${patient.age} / ${patient.gender}` },
    { label: "Blood Type", value: patient.bloodType || "—" },
    {
      label: "Triage",
      value: (
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${triageStyle[patient.triageTier] || triageStyle.stable}`}>
          {patient.triageTier}
        </span>
      ),
    },
    { label: "Location", value: patient.ward ? `${patient.ward}${patient.bed ? ` / ${patient.bed}` : ""}` : patient.admissionStatus },
    { label: "PhilHealth PIN", value: <span className="font-mono">{patient.philhealth?.pin || "—"}</span> },
    { label: "Chief Complaint", value: patient.chiefComplaint || "—", wide: true },
    {
      label: "Allergies",
      value: allergies.length ? <span className="font-bold text-rose-700">{allergies.join(", ")}</span> : "NKDA",
    },
    ...extra,
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-base font-bold text-slate-900 truncate">{patient.name}</h2>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 shrink-0">
            {patient.id}
          </span>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 text-xs divide-x divide-slate-100">
        {fields.map(f => (
          <div key={f.label} className={`px-4 py-2.5 border-b border-slate-100 ${f.wide ? "col-span-2" : ""}`}>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.label}</dt>
            <dd className="mt-0.5 font-semibold text-slate-800 line-clamp-2">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
