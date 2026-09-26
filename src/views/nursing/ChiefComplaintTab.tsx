import React, { useState } from "react";
import { ChiefComplaintEntry } from "../../types";
import { useOpdData } from "../../context/OpdDataContext";
import { useWardData } from "../../context/WardDataContext";
import { hospitalDb } from "../../services/db";
import Modal from "../../components/Modal";
import { Plus, Search } from "../../components/Icons";
import * as ui from "../../components/tableStyles";
import { NursingTabProps, newId, nowStamp, staffLabel } from "./helpers";

const severityStyle = (n: number) =>
  n >= 7
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : n >= 4
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

const emptyDraft = (patientId: string) => ({
  patientId,
  complaint: "",
  onset: "",
  duration: "",
  location: "",
  severity: "0",
  associatedSymptoms: "",
});

export default function ChiefComplaintTab({ user, patients, patientId }: NursingTabProps) {
  const { setPatients } = useOpdData();
  const { chiefComplaints, saveChiefComplaint } = useWardData();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof emptyDraft> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const visiblePatients = patients.filter(p => {
    if (patientId && p.id !== patientId) return false;
    const q = search.toLowerCase();
    return !q || [p.name, p.id, p.chiefComplaint].some(v => (v || "").toLowerCase().includes(q));
  });
  const history = chiefComplaints.filter(c => !patientId || c.patientId === patientId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const patient = patients.find(p => p.id === draft.patientId);
    if (!patient) return setError("Select a patient.");
    if (!draft.complaint.trim()) return setError("Chief complaint is required.");
    const entry: ChiefComplaintEntry = {
      id: newId("CC"),
      patientId: patient.id,
      patientName: patient.name,
      recordedAt: nowStamp(),
      recordedBy: staffLabel(user),
      complaint: draft.complaint.trim(),
      onset: draft.onset.trim(),
      duration: draft.duration.trim(),
      location: draft.location.trim(),
      severity: Math.min(10, Math.max(0, Number(draft.severity) || 0)),
      associatedSymptoms: draft.associatedSymptoms.trim(),
    };
    setBusy(true);
    try {
      await saveChiefComplaint(entry);
      // The latest complaint also becomes the patient's current chief complaint
      const updatedPatient = { ...patient, chiefComplaint: entry.complaint };
      await hospitalDb.savePatient(updatedPatient);
      setPatients(prev => prev.map(p => (p.id === patient.id ? updatedPatient : p)));
      setDraft(null);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const latestFor = (id: string) => chiefComplaints.find(c => c.patientId === id);

  return (
    <div className="space-y-4">
      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Current Chief Complaints</h3>
            <div className="relative w-64">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patient or complaint..."
                className={`${ui.input} pl-8`}
              />
            </div>
          </div>
          <button
            onClick={() => {
              setError(null);
              setDraft(emptyDraft(patientId || patients[0]?.id || ""));
            }}
            className={ui.primaryBtn}
          >
            <Plus size={14} /> Record Chief Complaint
          </button>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Age / Sex</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>Chief Complaint</th>
                <th className={ui.th}>Severity</th>
                <th className={ui.th}>Last Recorded</th>
                <th className={ui.th}></th>
              </tr>
            </thead>
            <tbody>
              {visiblePatients.length === 0 && (
                <tr>
                  <td colSpan={7} className={ui.emptyCell}>
                    No patients found.
                  </td>
                </tr>
              )}
              {visiblePatients.map(p => {
                const latest = latestFor(p.id);
                return (
                  <tr key={p.id} className={ui.tr}>
                    <td className={ui.td}>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.id}</div>
                    </td>
                    <td className={`${ui.td} whitespace-nowrap`}>
                      {p.age} / {p.gender}
                    </td>
                    <td className={ui.td}>{p.admissionStatus}</td>
                    <td className={`${ui.td} font-medium text-slate-900 max-w-[320px]`}>{p.chiefComplaint || "—"}</td>
                    <td className={ui.td}>
                      {latest ? (
                        <span className={`${ui.badge} ${severityStyle(latest.severity)}`}>{latest.severity}/10</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={`${ui.td} whitespace-nowrap`}>
                      {latest ? (
                        <>
                          <div className="font-mono">{latest.recordedAt}</div>
                          <div className="text-[10px] text-slate-400">{latest.recordedBy}</div>
                        </>
                      ) : (
                        <span className="text-slate-400">At registration</span>
                      )}
                    </td>
                    <td className={`${ui.td} text-right`}>
                      <button
                        onClick={() => {
                          setError(null);
                          setDraft(emptyDraft(p.id));
                        }}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <h3 className="text-sm font-bold text-slate-900">Chief Complaint History</h3>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Date / Time</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Complaint</th>
                <th className={ui.th}>Onset</th>
                <th className={ui.th}>Duration</th>
                <th className={ui.th}>Location</th>
                <th className={ui.th}>Severity</th>
                <th className={ui.th}>Associated Symptoms</th>
                <th className={ui.th}>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={9} className={ui.emptyCell}>
                    No chief complaints recorded yet.
                  </td>
                </tr>
              )}
              {history.map(c => (
                <tr key={c.id} className={ui.tr}>
                  <td className={`${ui.td} font-mono whitespace-nowrap`}>{c.recordedAt}</td>
                  <td className={`${ui.td} font-bold text-slate-900 whitespace-nowrap`}>{c.patientName}</td>
                  <td className={`${ui.td} font-medium text-slate-900`}>{c.complaint}</td>
                  <td className={ui.td}>{c.onset || "—"}</td>
                  <td className={ui.td}>{c.duration || "—"}</td>
                  <td className={ui.td}>{c.location || "—"}</td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${severityStyle(c.severity)}`}>{c.severity}/10</span>
                  </td>
                  <td className={`${ui.td} max-w-[220px]`}>{c.associatedSymptoms || "—"}</td>
                  <td className={`${ui.td} whitespace-nowrap`}>{c.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <Modal
          title="Record Chief Complaint"
          subtitle="The patient's main reason for the visit, in their own words"
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" onClick={() => setDraft(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="complaint-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Save"}
              </button>
            </>
          }
        >
          <form id="complaint-form" onSubmit={submit} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
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
              <label className={ui.label}>Chief Complaint *</label>
              <textarea
                rows={2}
                value={draft.complaint}
                onChange={e => setDraft({ ...draft, complaint: e.target.value })}
                placeholder='e.g. "Sumasakit ang dibdib ko" — chest pain'
                className={ui.input}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>Onset</label>
                <input
                  value={draft.onset}
                  onChange={e => setDraft({ ...draft, onset: e.target.value })}
                  placeholder="e.g. Sudden, this morning"
                  className={ui.input}
                />
              </div>
              <div>
                <label className={ui.label}>Duration</label>
                <input
                  value={draft.duration}
                  onChange={e => setDraft({ ...draft, duration: e.target.value })}
                  placeholder="e.g. 2 days"
                  className={ui.input}
                />
              </div>
              <div>
                <label className={ui.label}>Location</label>
                <input
                  value={draft.location}
                  onChange={e => setDraft({ ...draft, location: e.target.value })}
                  placeholder="e.g. Left lower quadrant"
                  className={ui.input}
                />
              </div>
              <div>
                <label className={ui.label}>Severity (0–10)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={draft.severity}
                  onChange={e => setDraft({ ...draft, severity: e.target.value })}
                  className={ui.input}
                />
              </div>
            </div>
            <div>
              <label className={ui.label}>Associated Symptoms</label>
              <input
                value={draft.associatedSymptoms}
                onChange={e => setDraft({ ...draft, associatedSymptoms: e.target.value })}
                placeholder="e.g. Nausea, dizziness"
                className={ui.input}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
