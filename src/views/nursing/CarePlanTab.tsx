import React, { useState } from "react";
import { CarePlanStatus, NursingCarePlan } from "../../types";
import { useWardData } from "../../context/WardDataContext";
import Modal from "../../components/Modal";
import { Plus, Search } from "../../components/Icons";
import * as ui from "../../components/tableStyles";
import { NursingTabProps, newId, nowStamp, staffLabel } from "./helpers";

const STATUSES: CarePlanStatus[] = ["Active", "Goal Met", "Partially Met", "Not Met", "Revised"];

const statusStyle: Record<CarePlanStatus, string> = {
  Active: "bg-sky-50 text-sky-700 border-sky-200",
  "Goal Met": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Partially Met": "bg-amber-50 text-amber-700 border-amber-200",
  "Not Met": "bg-rose-50 text-rose-700 border-rose-200",
  Revised: "bg-violet-50 text-violet-700 border-violet-200",
};

type Draft = Omit<NursingCarePlan, "id" | "createdAt" | "updatedAt" | "nurse" | "patientName">;

const emptyDraft = (patientId: string): Draft => ({
  patientId,
  subjectiveData: "",
  objectiveData: "",
  nursingDiagnosis: "",
  relatedTo: "",
  goal: "",
  expectedOutcomes: "",
  interventions: "",
  rationale: "",
  evaluation: "",
  status: "Active",
});

const ADPIE_STEPS: { key: string; letter: string; title: string; fields: { name: keyof Draft; label: string; hint: string }[] }[] = [
  {
    key: "a",
    letter: "A",
    title: "Assessment",
    fields: [
      { name: "subjectiveData", label: "Subjective Data (what the patient says)", hint: '"Masakit ang tiyan ko," pain 7/10' },
      { name: "objectiveData", label: "Objective Data (what you observe / measure)", hint: "BP 140/90, guarding on palpation, grimacing" },
    ],
  },
  {
    key: "d",
    letter: "D",
    title: "Nursing Diagnosis",
    fields: [
      { name: "nursingDiagnosis", label: "Nursing Diagnosis (NANDA-I)", hint: "Acute Pain" },
      { name: "relatedTo", label: "Related to / As evidenced by", hint: "r/t inflammatory process AEB pain score 7/10" },
    ],
  },
  {
    key: "p",
    letter: "P",
    title: "Planning",
    fields: [
      { name: "goal", label: "Goal", hint: "Patient will report pain relief within 8 hours of care" },
      { name: "expectedOutcomes", label: "Expected Outcomes", hint: "Pain score ≤ 3/10; relaxed facial expression" },
    ],
  },
  {
    key: "i",
    letter: "I",
    title: "Intervention",
    fields: [
      { name: "interventions", label: "Nursing Interventions (one per line)", hint: "Monitor VS q4h\nAdminister analgesic as ordered" },
      { name: "rationale", label: "Rationale", hint: "Provides baseline data; relieves pain" },
    ],
  },
  {
    key: "e",
    letter: "E",
    title: "Evaluation",
    fields: [{ name: "evaluation", label: "Evaluation", hint: "Goal met — patient verbalized pain 2/10 after 4 hours" }],
  },
];

export default function CarePlanTab({ user, patients, patientId }: NursingTabProps) {
  const { carePlans, saveCarePlan } = useWardData();
  const canEdit = user.role === "nurse";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CarePlanStatus>("All");
  const [editing, setEditing] = useState<NursingCarePlan | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [viewing, setViewing] = useState<NursingCarePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = carePlans.filter(p => {
    if (patientId && p.patientId !== patientId) return false;
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return !q || [p.patientName, p.nursingDiagnosis, p.nurse].some(v => v.toLowerCase().includes(q));
  });

  const openNew = () => {
    setEditing(null);
    setError(null);
    setDraft(emptyDraft(patientId || patients[0]?.id || ""));
  };

  const openEdit = (plan: NursingCarePlan) => {
    setEditing(plan);
    setError(null);
    const { id, createdAt, updatedAt, nurse, patientName, ...rest } = plan;
    setDraft(rest);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const patient = patients.find(p => p.id === draft.patientId);
    if (!patient) return setError("Select a patient.");
    if (!draft.nursingDiagnosis.trim() || !draft.goal.trim() || !draft.interventions.trim()) {
      return setError("Nursing diagnosis, goal and interventions are required.");
    }
    const stamp = nowStamp();
    const plan: NursingCarePlan = {
      ...draft,
      id: editing?.id ?? newId("NCP"),
      patientName: patient.name,
      createdAt: editing?.createdAt ?? stamp,
      updatedAt: stamp,
      nurse: editing?.nurse ?? staffLabel(user),
    };
    setBusy(true);
    try {
      await saveCarePlan(plan);
      setDraft(null);
    } catch {
      setError("Could not save the care plan. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const set = (name: keyof Draft, value: string) => setDraft(d => (d ? { ...d, [name]: value } : d));

  return (
    <div className={ui.tableWrap}>
      <div className={ui.toolbar}>
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, diagnosis, nurse..."
              className={`${ui.input} pl-8`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as "All" | CarePlanStatus)}
            className={ui.inlineInput}
          >
            <option value="All">All statuses</option>
            {STATUSES.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {canEdit && (
          <button onClick={openNew} className={ui.primaryBtn}>
            <Plus size={14} /> New Care Plan (ADPIE)
          </button>
        )}
      </div>

      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead className={ui.thead}>
            <tr>
              <th className={ui.th}>Updated</th>
              <th className={ui.th}>Patient</th>
              <th className={ui.th}>Nursing Diagnosis</th>
              <th className={ui.th}>Goal</th>
              <th className={ui.th}>Interventions</th>
              <th className={ui.th}>Status</th>
              <th className={ui.th}>Nurse</th>
              <th className={ui.th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={ui.emptyCell}>
                  No care plans yet.{canEdit && " Click “New Care Plan (ADPIE)” to create one."}
                </td>
              </tr>
            )}
            {rows.map(p => (
              <tr key={p.id} className={ui.tr}>
                <td className={`${ui.td} font-mono whitespace-nowrap`}>{p.updatedAt}</td>
                <td className={ui.td}>
                  <div className="font-bold text-slate-900">{p.patientName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{p.patientId}</div>
                </td>
                <td className={ui.td}>
                  <div className="font-semibold text-slate-900">{p.nursingDiagnosis}</div>
                  <div className="text-[11px] text-slate-500">{p.relatedTo}</div>
                </td>
                <td className={`${ui.td} max-w-[220px]`}>{p.goal}</td>
                <td className={`${ui.td} max-w-[240px] whitespace-pre-line`}>{p.interventions}</td>
                <td className={ui.td}>
                  <span className={`${ui.badge} ${statusStyle[p.status]}`}>{p.status}</span>
                </td>
                <td className={`${ui.td} whitespace-nowrap`}>{p.nurse}</td>
                <td className={`${ui.td} whitespace-nowrap text-right`}>
                  <button onClick={() => setViewing(p)} className="text-emerald-700 font-bold hover:underline cursor-pointer">
                    View
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => openEdit(p)}
                      className="ml-3 text-slate-600 font-bold hover:underline cursor-pointer"
                    >
                      Update
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <Modal
          wide
          title={`Nursing Care Plan — ${viewing.patientName}`}
          subtitle={`${viewing.id} • by ${viewing.nurse} • updated ${viewing.updatedAt}`}
          onClose={() => setViewing(null)}
        >
          <table className={`${ui.table} border border-slate-200 rounded-lg`}>
            <tbody>
              {ADPIE_STEPS.flatMap(step =>
                step.fields.map((f, i) => (
                  <tr key={f.name} className="border-b border-slate-100 align-top">
                    {i === 0 && (
                      <td
                        rowSpan={step.fields.length}
                        className="px-3 py-2 bg-emerald-50 text-emerald-800 font-bold w-32 border-r border-slate-200"
                      >
                        <span className="text-lg mr-1">{step.letter}</span>
                        {step.title}
                      </td>
                    )}
                    <td className="px-3 py-2 w-48 text-slate-500 font-semibold">{f.label}</td>
                    <td className="px-3 py-2 text-slate-800 whitespace-pre-line">{String(viewing[f.name as keyof NursingCarePlan] || "—")}</td>
                  </tr>
                ))
              )}
              <tr>
                <td className="px-3 py-2 bg-slate-50 font-bold" colSpan={2}>
                  Status
                </td>
                <td className="px-3 py-2">
                  <span className={`${ui.badge} ${statusStyle[viewing.status]}`}>{viewing.status}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </Modal>
      )}

      {draft && (
        <Modal
          wide
          title={editing ? "Update Nursing Care Plan" : "New Nursing Care Plan (ADPIE)"}
          subtitle="Assessment → Diagnosis → Planning → Intervention → Evaluation"
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" onClick={() => setDraft(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="care-plan-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Save Care Plan"}
              </button>
            </>
          }
        >
          <form id="care-plan-form" onSubmit={submit} className="space-y-4">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>Patient *</label>
                <select
                  value={draft.patientId}
                  disabled={!!editing}
                  onChange={e => set("patientId", e.target.value)}
                  className={ui.input}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>Status</label>
                <select value={draft.status} onChange={e => set("status", e.target.value)} className={ui.input}>
                  {STATUSES.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {ADPIE_STEPS.map(step => (
              <fieldset key={step.key} className="border border-slate-200 rounded-xl p-3">
                <legend className="px-1.5 text-xs font-bold text-emerald-800">
                  {step.letter} — {step.title}
                </legend>
                <div className={`grid grid-cols-1 ${step.fields.length > 1 ? "sm:grid-cols-2" : ""} gap-3`}>
                  {step.fields.map(f => (
                    <div key={f.name}>
                      <label className={ui.label}>{f.label}</label>
                      <textarea
                        rows={3}
                        value={String(draft[f.name] ?? "")}
                        onChange={e => set(f.name, e.target.value)}
                        placeholder={f.hint}
                        className={ui.input}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          </form>
        </Modal>
      )}
    </div>
  );
}
