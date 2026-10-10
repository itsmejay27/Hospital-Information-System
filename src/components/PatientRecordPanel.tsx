import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { useCollection } from "../hooks/useCollection";
import { useMovementHistory } from "../hooks/useMovementHistory";
import { OpdCase, ROLE_LABELS } from "../types";
import { dt } from "../services/time";
import { esc, printDocument } from "../services/print";
import { movementBadge, movementStyle, tierStyle, tierText } from "./movementStyles";
import * as ui from "./tableStyles";
import { History, Printer, X } from "./Icons";

type Tab = "movements" | "stays" | "visits" | "labs" | "meds" | "opd";

const byNewest =
  <T,>(get: (x: T) => string | undefined) =>
  (a: T, b: T) =>
    (get(b) || "").localeCompare(get(a) || "");

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-semibold text-slate-800 truncate">{value || "—"}</div>
    </div>
  );
}

/**
 * A patient's whole history in one place, also after discharge: profile, every admission / transfer /
 * referral / discharge, discharge summaries, and (for doctors and nurses) consultations, lab and imaging
 * results, medicines and OPD Ward visits. Opens as a side panel; Print gives a paper copy.
 */
export default function PatientRecordPanel({ patientId, patientName, onClose }: { patientId: string; patientName?: string; onClose: () => void }) {
  const { user } = useAuth();
  const { patients, records, labResults, medications, discharges, admissions } = useOpdData();
  const { rows } = useMovementHistory();
  const opdCases = useCollection<OpdCase>("opd_cases");
  // Front desk sees movements and discharge dates / follow-ups; clinical notes stay with doctors and nurses
  const clinical = user?.role === "doctor" || user?.role === "nurse";
  const [tab, setTab] = useState<Tab>("movements");
  const [printError, setPrintError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patient = patients.find(p => p.id === patientId);
  const name = patient?.name || patientName || patientId;

  const data = useMemo(
    () => ({
      movements: rows.filter(m => m.patientId === patientId),
      stays: admissions.filter(a => a.patientId === patientId).sort(byNewest(a => a.admissionDate)),
      discharges: discharges.filter(d => d.patientId === patientId).sort(byNewest(d => d.dischargeDate)),
      visits: records.filter(r => r.patientId === patientId).sort(byNewest(r => r.date)),
      labs: labResults.filter(l => l.patientId === patientId).sort(byNewest(l => l.releasedAt || l.orderedAt || l.date)),
      meds: medications.filter(m => m.patientId === patientId).sort(byNewest(m => m.start)),
      opd: opdCases.items.filter(c => c.patientId === patientId).sort(byNewest(c => c.createdAt)),
    }),
    [rows, admissions, discharges, records, labResults, medications, opdCases.items, patientId]
  );

  const tabs: [Tab, string, number][] = [
    ["movements", "Movements", data.movements.length],
    ["stays", "Admissions & Discharges", data.stays.length + data.discharges.length],
  ];
  if (clinical)
    tabs.push(
      ["visits", "Consultations", data.visits.length],
      ["labs", "Lab & Imaging", data.labs.length],
      ["meds", "Medicines", data.meds.length],
      ["opd", "OPD Ward", data.opd.length]
    );

  const print = () => {
    const table = (head: string[], body: (string | undefined)[][]) =>
      body.length === 0
        ? `<p class="muted">None on file.</p>`
        : `<table><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr>${body
            .map(r => `<tr>${r.map(c => `<td>${esc(c || "")}</td>`).join("")}</tr>`)
            .join("")}</table>`;
    let html = `<h2>Patient</h2><p><b>${esc(name)}</b> (${esc(patientId)})${
      patient ? ` • ${patient.age} yrs • ${esc(patient.gender)} • Blood type ${esc(patient.bloodType)}` : ""
    }<br>Status: ${esc(patient?.admissionStatus || "—")} • Condition: ${esc(tierText(patient?.triageTier))} • Allergies: ${esc(
      patient?.allergies?.join(", ") || "None recorded"
    )}</p>`;
    html += `<h2>Movements</h2>${table(
      ["Date & Time", "Movement", "From → To", "Condition", "Details", "By"],
      data.movements.map(m => [
        dt(m.at),
        m.type,
        [m.from, m.to].filter(Boolean).join(" → "),
        [tierText(m.conditionBefore), tierText(m.conditionAfter)].filter(Boolean).join(" → "),
        m.details,
        m.by,
      ])
    )}`;
    html += `<h2>Admissions</h2>${table(
      ["Admitted", "Ward / Bed", "Reason", "Physician", "Status", "Discharged"],
      data.stays.map(a => [dt(a.admissionDate), `${a.ward} / ${a.bed}`, a.reason, a.attendingPhysician, a.status, dt(a.dischargeDate)])
    )}`;
    html += `<h2>Discharges</h2>${table(
      clinical ? ["Date", "Disposition", "Condition", "Summary", "Instructions", "Follow-up", "Cleared by"] : ["Date", "Disposition", "Follow-up", "Cleared by"],
      data.discharges.map(d =>
        clinical
          ? [dt(d.dischargeDate), d.disposition, d.conditionAtDischarge, d.dischargeSummary, d.instructions, d.followUpDate, d.clearedByDoctor]
          : [dt(d.dischargeDate), d.disposition, d.followUpDate, d.clearedByDoctor]
      )
    )}`;
    if (clinical) {
      html += `<h2>Consultations</h2>${table(
        ["Date", "Type", "Diagnosis", "Assessment / Plan", "Doctor"],
        data.visits.map(r => [dt(r.date), r.type, `${r.diagnosis}${r.icd10Code ? ` (${r.icd10Code})` : ""}`, [r.assessment, r.plan].filter(Boolean).join(" — "), r.doctor])
      )}`;
      html += `<h2>Lab &amp; Imaging</h2>${table(
        ["Date", "Test", "Status", "Result"],
        data.labs.map(l => [dt(l.releasedAt || l.date), l.test, l.status, l.summary])
      )}`;
      html += `<h2>Medicines</h2>${table(
        ["Started", "Medicine", "Dose / Route / Frequency", "Status", "Prescribed by"],
        data.meds.map(m => [dt(m.start), m.name, `${m.dose} • ${m.route} • ${m.freq}`, m.status, m.prescribedBy])
      )}`;
    }
    setPrintError(printDocument(`Patient History — ${name}`, html) ? null : "Allow pop-ups for this site to print.");
  };

  const empty = (text: string) => <div className="py-10 text-center text-slate-400">{text}</div>;
  const card = "border border-slate-200 rounded-xl p-3.5 space-y-1.5";
  const section = "text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Patient history — ${name}`}
        className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <History size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">{name}</h2>
              <div className="text-[11px] text-slate-500">
                <span className="font-mono">{patientId}</span> • Complete patient history
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={print} className={ui.secondaryBtn}>
              <Printer size={14} /> Print
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {printError && <div className="px-5 py-2 text-xs font-semibold text-rose-700 bg-rose-50">{printError}</div>}

        <div className="px-5 py-4 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/60">
          <Field label="Age / Sex" value={patient ? `${patient.age} yrs • ${patient.gender}` : undefined} />
          <Field label="Blood Type" value={patient?.bloodType} />
          <Field
            label="Status"
            value={
              patient && (
                <span className={patient.admissionStatus === "Discharged" ? "text-slate-500" : "text-emerald-700"}>
                  {patient.admissionStatus}
                  {patient.ward ? ` • ${patient.ward}${patient.bed ? ` / ${patient.bed}` : ""}` : ""}
                </span>
              )
            }
          />
          <Field label="Condition" value={patient && <span className={`${ui.badge} ${tierStyle[patient.triageTier]}`}>{tierText(patient.triageTier)}</span>} />
          <Field label="Allergies" value={patient?.allergies?.length ? <span className="text-rose-700">{patient.allergies.join(", ")}</span> : "None recorded"} />
          <Field label="Attending" value={patient?.attendingPhysician} />
          <Field label="Registered" value={dt(patient?.registeredAt)} />
          <Field label="Contact" value={patient?.contact} />
        </div>

        <div className="px-3 pt-2 border-b border-slate-100 flex gap-1 overflow-x-auto">
          {tabs.map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer flex items-center gap-1.5 ${
                tab === id ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{count}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-xs">
          {tab === "movements" &&
            (data.movements.length === 0 ? (
              empty("No admissions, transfers or discharges yet.")
            ) : (
              <ol className="relative border-l-2 border-slate-100 ml-2 space-y-4">
                {data.movements.map(m => (
                  <li key={m.id} className="pl-5 relative">
                    <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`${movementBadge} ${movementStyle[m.type]}`}>{m.type}</span>
                      <span className="font-mono text-slate-500">{dt(m.at)}</span>
                    </div>
                    {(m.from || m.to) && (
                      <div className="mt-1.5 text-slate-700">
                        {m.from && <span className="text-slate-500">{m.from}</span>}
                        {m.from && m.to && " → "}
                        {m.to && <span className="font-semibold text-slate-900">{m.to}</span>}
                      </div>
                    )}
                    {(m.conditionBefore || m.conditionAfter) && (
                      <div className="mt-1 text-slate-600">
                        Condition:{" "}
                        {m.conditionBefore && m.conditionAfter && m.conditionBefore !== m.conditionAfter ? (
                          <>
                            {tierText(m.conditionBefore)} → <b className="text-emerald-700">{tierText(m.conditionAfter)}</b>
                          </>
                        ) : (
                          tierText(m.conditionAfter || m.conditionBefore)
                        )}
                      </div>
                    )}
                    {m.details && <p className="mt-1 text-slate-600 whitespace-pre-line">{m.details}</p>}
                    <div className="mt-1 text-[10px] text-slate-400">
                      {m.by} • {ROLE_LABELS[m.byRole] || m.byRole}
                    </div>
                  </li>
                ))}
              </ol>
            ))}

          {tab === "stays" && (
            <div className="space-y-5">
              <section>
                <h3 className={section}>Ward admissions</h3>
                {data.stays.length === 0 ? (
                  <p className="text-slate-400">No ward admissions.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className={ui.table}>
                      <thead className={ui.thead}>
                        <tr>
                          <th className={ui.th}>Admitted</th>
                          <th className={ui.th}>Ward / Bed</th>
                          <th className={ui.th}>Physician</th>
                          <th className={ui.th}>Status</th>
                          <th className={ui.th}>Discharged</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.stays.map(a => (
                          <tr key={a.id} className={ui.tr}>
                            <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(a.admissionDate)}</td>
                            <td className={ui.td}>
                              <div className="font-semibold text-slate-900">
                                {a.ward} / {a.bed}
                              </div>
                              <div className="text-[10px] text-slate-500">{a.reason}</div>
                            </td>
                            <td className={ui.td}>{a.attendingPhysician}</td>
                            <td className={ui.td}>{a.status}</td>
                            <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(a.dischargeDate) || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              <section>
                <h3 className={section}>Discharge records</h3>
                {data.discharges.length === 0 ? (
                  <p className="text-slate-400">No discharge records.</p>
                ) : (
                  <div className="space-y-3">
                    {data.discharges.map(d => (
                      <div key={d.id} className={card}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{d.disposition}</span>
                          <span className="font-mono text-slate-500">{dt(d.dischargeDate)}</span>
                        </div>
                        {d.referredTo && (
                          <div>
                            Referred to: <b>{d.referredTo}</b>
                          </div>
                        )}
                        {clinical && d.conditionAtDischarge && (
                          <div>
                            Condition at discharge: <b>{d.conditionAtDischarge}</b>
                          </div>
                        )}
                        {clinical && d.dischargeSummary && <p className="text-slate-700 whitespace-pre-line">{d.dischargeSummary}</p>}
                        {clinical && d.dischargeMeds && d.dischargeMeds.length > 0 && <div>Take-home medicines: {d.dischargeMeds.join(", ")}</div>}
                        {clinical && d.instructions && <div className="text-slate-600">Instructions: {d.instructions}</div>}
                        {d.followUpDate && (
                          <div>
                            Follow-up: <b>{d.followUpDate}</b>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">Cleared by {d.clearedByDoctor}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "visits" &&
            (data.visits.length === 0 ? (
              empty("No consultations recorded.")
            ) : (
              <div className="space-y-3">
                {data.visits.map(r => (
                  <div key={r.id} className={card}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {r.diagnosis}
                        {r.icd10Code && <span className="ml-1.5 font-mono text-[10px] text-slate-500">{r.icd10Code}</span>}
                      </span>
                      <span className="font-mono text-slate-500">{dt(r.date)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {r.type} • {r.doctor}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 pt-1">
                      {(
                        [
                          ["Subjective", r.subjective],
                          ["Objective", r.objective],
                          ["Assessment", r.assessment],
                          ["Plan", r.plan],
                        ] as const
                      ).map(([k, v]) =>
                        v ? (
                          <div key={k}>
                            <div className="text-[10px] font-bold uppercase text-slate-400">{k}</div>
                            <p className="text-slate-700 whitespace-pre-line">{v}</p>
                          </div>
                        ) : null
                      )}
                    </div>
                    {r.vitals && (r.vitals.bp || r.vitals.hr) && (
                      <div className="text-slate-600">
                        Vitals: BP {r.vitals.bp || "—"} • HR {r.vitals.hr || "—"} • Temp {r.vitals.temp || "—"} • SpO₂ {r.vitals.spo2 || "—"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {tab === "labs" &&
            (data.labs.length === 0 ? (
              empty("No lab or imaging results.")
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className={ui.table}>
                  <thead className={ui.thead}>
                    <tr>
                      <th className={ui.th}>Date</th>
                      <th className={ui.th}>Test</th>
                      <th className={ui.th}>Status</th>
                      <th className={ui.th}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.labs.map(l => (
                      <tr key={l.id} className={ui.tr}>
                        <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(l.releasedAt || l.date)}</td>
                        <td className={ui.td}>
                          <div className="font-semibold text-slate-900">{l.test}</div>
                          <div className="text-[10px] text-slate-500">{l.category}</div>
                        </td>
                        <td className={`${ui.td} whitespace-nowrap`}>{l.status}</td>
                        <td className={ui.td}>
                          {l.summary || "—"}
                          {l.items.some(i => i.flag) && (
                            <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                              {l.items
                                .filter(i => i.flag)
                                .map(i => `${i.name} ${i.value}${i.unit ? ` ${i.unit}` : ""} (${i.flag})`)
                                .join(", ")}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "meds" &&
            (data.meds.length === 0 ? (
              empty("No medicines prescribed.")
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className={ui.table}>
                  <thead className={ui.thead}>
                    <tr>
                      <th className={ui.th}>Started</th>
                      <th className={ui.th}>Medicine</th>
                      <th className={ui.th}>Status</th>
                      <th className={ui.th}>Prescribed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.meds.map(m => (
                      <tr key={m.id} className={ui.tr}>
                        <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(m.start)}</td>
                        <td className={ui.td}>
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {m.dose} • {m.route} • {m.freq}
                          </div>
                        </td>
                        <td className={`${ui.td} whitespace-nowrap`}>{m.status}</td>
                        <td className={ui.td}>{m.prescribedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "opd" &&
            (data.opd.length === 0 ? (
              empty("No OPD Ward visits.")
            ) : (
              <div className="space-y-3">
                {data.opd.map(c => (
                  <div key={c.id} className={card}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{c.caseType}</span>
                      <span className="font-mono text-slate-500">{dt(c.createdAt)}</span>
                    </div>
                    <div className="text-slate-700">{c.complaint}</div>
                    {c.doctorPlan && <div className="text-slate-600">Doctor's plan: {c.doctorPlan}</div>}
                    <div className="text-[10px] text-slate-400">
                      {c.status}
                      {c.disposition ? ` • ${c.disposition.type} by ${c.disposition.by} (${dt(c.disposition.at)})` : ""}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
