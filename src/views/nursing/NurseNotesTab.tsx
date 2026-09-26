import React, { useState } from "react";
import { DutyShift, NurseNote } from "../../types";
import { useWardData } from "../../context/WardDataContext";
import Modal from "../../components/Modal";
import { Plus, Search } from "../../components/Icons";
import * as ui from "../../components/tableStyles";
import { NursingTabProps, currentShift, newId, nowStamp, staffLabel } from "./helpers";

const FDAR: { name: "focus" | "data" | "action" | "response"; letter: string; label: string; hint: string }[] = [
  { name: "focus", letter: "F", label: "Focus", hint: "e.g. Acute pain, Fever, Post-op care" },
  { name: "data", letter: "D", label: "Data", hint: "Subjective & objective findings — VS, complaints, observations" },
  { name: "action", letter: "A", label: "Action", hint: "Nursing actions done, medications given, doctor notified" },
  { name: "response", letter: "R", label: "Response", hint: "Patient's response to the actions" },
];

export default function NurseNotesTab({ user, patients, patientId }: NursingTabProps) {
  const { nurseNotes, saveNurseNote } = useWardData();
  const canWrite = user.role === "nurse";
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState<"All" | DutyShift>("All");
  const [draft, setDraft] = useState<{ patientId: string; shift: DutyShift; focus: string; data: string; action: string; response: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = nurseNotes.filter(n => {
    if (patientId && n.patientId !== patientId) return false;
    if (shiftFilter !== "All" && n.shift !== shiftFilter) return false;
    const q = search.toLowerCase();
    return !q || [n.patientName, n.focus, n.data, n.nurse].some(v => v.toLowerCase().includes(q));
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const patient = patients.find(p => p.id === draft.patientId);
    if (!patient) return setError("Select a patient.");
    if (!draft.focus.trim() || !draft.data.trim()) return setError("Focus and Data are required.");
    const note: NurseNote = {
      id: newId("NN"),
      patientId: patient.id,
      patientName: patient.name,
      timestamp: nowStamp(),
      shift: draft.shift,
      nurse: staffLabel(user),
      focus: draft.focus.trim(),
      data: draft.data.trim(),
      action: draft.action.trim(),
      response: draft.response.trim(),
    };
    setBusy(true);
    try {
      await saveNurseNote(note);
      setDraft(null);
    } catch {
      setError("Could not save the note. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={ui.tableWrap}>
      <div className={ui.toolbar}>
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, focus, nurse..."
              className={`${ui.input} pl-8`}
            />
          </div>
          <select
            value={shiftFilter}
            onChange={e => setShiftFilter(e.target.value as "All" | DutyShift)}
            className={ui.inlineInput}
          >
            <option value="All">All shifts</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Night</option>
          </select>
        </div>
        {canWrite && (
          <button
            onClick={() => {
              setError(null);
              setDraft({ patientId: patientId || patients[0]?.id || "", shift: currentShift(), focus: "", data: "", action: "", response: "" });
            }}
            className={ui.primaryBtn}
          >
            <Plus size={14} /> New Nurse's Note
          </button>
        )}
      </div>

      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead className={ui.thead}>
            <tr>
              <th className={ui.th}>Date / Time</th>
              <th className={ui.th}>Shift</th>
              <th className={ui.th}>Patient</th>
              <th className={ui.th}>Focus</th>
              <th className={ui.th}>Data</th>
              <th className={ui.th}>Action</th>
              <th className={ui.th}>Response</th>
              <th className={ui.th}>Nurse</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={ui.emptyCell}>
                  No nurses' notes yet.
                </td>
              </tr>
            )}
            {rows.map(n => (
              <tr key={n.id} className={ui.tr}>
                <td className={`${ui.td} font-mono whitespace-nowrap`}>{n.timestamp}</td>
                <td className={ui.td}>{n.shift}</td>
                <td className={ui.td}>
                  <div className="font-bold text-slate-900">{n.patientName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{n.patientId}</div>
                </td>
                <td className={`${ui.td} font-semibold text-slate-900`}>{n.focus}</td>
                <td className={`${ui.td} max-w-[220px] whitespace-pre-line`}>{n.data}</td>
                <td className={`${ui.td} max-w-[220px] whitespace-pre-line`}>{n.action || "—"}</td>
                <td className={`${ui.td} max-w-[220px] whitespace-pre-line`}>{n.response || "—"}</td>
                <td className={`${ui.td} whitespace-nowrap`}>{n.nurse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <Modal
          wide
          title="New Nurse's Note (FDAR)"
          subtitle={`Charted by ${staffLabel(user)} at ${nowStamp()}`}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" onClick={() => setDraft(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="nurse-note-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Save Note"}
              </button>
            </>
          }
        >
          <form id="nurse-note-form" onSubmit={submit} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>Patient *</label>
                <select value={draft.patientId} onChange={e => setDraft({ ...draft, patientId: e.target.value })} className={ui.input}>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>Shift</label>
                <select
                  value={draft.shift}
                  onChange={e => setDraft({ ...draft, shift: e.target.value as DutyShift })}
                  className={ui.input}
                >
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Night</option>
                </select>
              </div>
            </div>
            {FDAR.map(f => (
              <div key={f.name}>
                <label className={ui.label}>
                  {f.letter} — {f.label}
                  {(f.name === "focus" || f.name === "data") && " *"}
                </label>
                <textarea
                  rows={f.name === "focus" ? 1 : 3}
                  value={draft[f.name]}
                  onChange={e => setDraft({ ...draft, [f.name]: e.target.value })}
                  placeholder={f.hint}
                  className={ui.input}
                />
              </div>
            ))}
          </form>
        </Modal>
      )}
    </div>
  );
}
