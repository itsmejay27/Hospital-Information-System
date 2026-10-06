import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { DiagnosticResult, LabTestItem } from "../types";
import { timestamp } from "../services/ids";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import LabResultsTable, { PrintReportButton } from "../components/LabResultsTable";
import * as ui from "../components/tableStyles";
import { FlaskConical, Scan, Search, Plus, X } from "../components/Icons";
import { dt } from "../services/time";

type Mode = "lab" | "imaging";
type Tab = "todo" | "progress" | "released" | "all";

const statusStyle: Record<DiagnosticResult["status"], string> = {
  "Pending Analysis": "bg-sky-50 text-sky-700 border-sky-200",
  "In-Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const statusLabel: Record<DiagnosticResult["status"], string> = {
  "Pending Analysis": "Ordered",
  "In-Progress": "In Progress",
  Ready: "Released",
};
const priorityRank = { STAT: 0, Urgent: 1, Routine: 2 } as const;

const blankRow = (): LabTestItem => ({ name: "", value: "", unit: "", ref: "", flag: null });

/** High / Low flag from a numeric value and a reference range like "12.0–16.0", "< 200" or "> 60". undefined = can't tell. */
function autoFlag(value: string, ref: string): LabTestItem["flag"] | undefined {
  const v = parseFloat(value.replace(/,/g, ""));
  if (Number.isNaN(v)) return undefined;
  const nums = (ref.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  const range = ref.match(/(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    return v < lo ? "L" : v > hi ? "H" : null;
  }
  if (/^\s*[<≤]/.test(ref) && nums.length === 1) return v > nums[0] ? "H" : null;
  if (/^\s*[>≥]/.test(ref) && nums.length === 1) return v < nums[0] ? "L" : null;
  return undefined;
}

/** Laboratory (Medical Technologist) or Imaging (Radiologic Technologist) worklist. */
export default function DiagnosticsWorklistView({ mode }: { mode: Mode }) {
  const { user } = useAuth();
  const { labResults, updateLabResult } = useOpdData();
  const isImaging = mode === "imaging";
  const canWork = user?.role === (isImaging ? "radtech" : "medtech");

  const [tab, setTab] = useState<Tab>(canWork ? "todo" : "all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DiagnosticResult | null>(null);
  const [viewing, setViewing] = useState<DiagnosticResult | null>(null);
  const [rows, setRows] = useState<LabTestItem[]>([]);
  const [findings, setFindings] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mine = useMemo(
    () => labResults.filter(l => (isImaging ? l.category === "Radiology" : l.category !== "Radiology")),
    [labResults, isImaging]
  );
  const counts = {
    todo: mine.filter(l => l.status === "Pending Analysis").length,
    progress: mine.filter(l => l.status === "In-Progress").length,
    released: mine.filter(l => l.status === "Ready").length,
    all: mine.length,
  };

  const rowsShown = mine
    .filter(l => {
      if (tab === "todo" && l.status !== "Pending Analysis") return false;
      if (tab === "progress" && l.status !== "In-Progress") return false;
      if (tab === "released" && l.status !== "Ready") return false;
      const q = search.toLowerCase();
      return !q || [l.patientName, l.patientId, l.test, l.orderingPhysician].some(v => v.toLowerCase().includes(q));
    })
    .sort((a, b) =>
      tab === "released" || tab === "all"
        ? (b.releasedAt || b.orderedAt || b.date).localeCompare(a.releasedAt || a.orderedAt || a.date)
        : priorityRank[a.priority || "Routine"] - priorityRank[b.priority || "Routine"] ||
          (a.orderedAt || a.date).localeCompare(b.orderedAt || b.date)
    );

  if (!user) return null;
  const signature = user.licenseNumber ? `${user.name} (${user.licenseNumber})` : user.name;

  const receive = async (l: DiagnosticResult) => {
    setError(null);
    try {
      await updateLabResult(
        { ...l, status: "In-Progress", performedBy: signature },
        `${isImaging ? "Started imaging study" : "Received specimen"}: ${l.test}`
      );
    } catch {
      setError("Could not update the order. Please try again.");
    }
  };

  const openResults = (l: DiagnosticResult) => {
    setError(null);
    setEditing(l);
    setRows(l.items.length ? l.items.map(i => ({ ...i })) : [blankRow(), blankRow(), blankRow()]);
    setFindings(l.findings || "");
    setInterpretation(l.summary || "");
  };

  const save = async (release: boolean) => {
    if (!editing) return;
    setError(null);
    const items = rows
      .map(r => ({ ...r, name: r.name.trim(), value: r.value.trim(), unit: r.unit?.trim() || undefined, ref: r.ref.trim() }))
      .filter(r => r.name || r.value);
    if (release) {
      if (isImaging && !findings.trim()) return setError("Enter the findings before releasing.");
      if (isImaging && !interpretation.trim()) return setError("Enter the impression before releasing.");
      if (!isImaging && items.length === 0) return setError("Enter at least one result before releasing.");
      if (!isImaging && items.some(r => !r.name || !r.value)) return setError("Each result row needs a parameter and a value.");
    }
    const updated: DiagnosticResult = {
      ...editing,
      items: isImaging ? [] : items,
      findings: isImaging ? findings.trim() : editing.findings,
      summary: interpretation.trim(),
      status: release ? "Ready" : "In-Progress",
      critical: !isImaging && items.some(r => r.flag === "HH" || r.flag === "LL"),
      performedBy: editing.performedBy || signature,
      ...(release ? { releasedBy: signature, releasedAt: timestamp().slice(0, 16) } : {}),
    };
    setBusy(true);
    try {
      await updateLabResult(updated, `${release ? "Released" : "Saved draft"} ${isImaging ? "imaging report" : "lab result"}: ${editing.test}`);
      setEditing(null);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const setRow = (i: number, patch: Partial<LabTestItem>) =>
    setRows(rs =>
      rs.map((r, idx) => {
        if (idx !== i) return r;
        const next = { ...r, ...patch };
        // Re-flag automatically when the value or reference range changes; the flag can still be changed by hand
        if (("value" in patch || "ref" in patch) && r.flag !== "HH" && r.flag !== "LL") {
          const f = autoFlag(next.value, next.ref);
          if (f !== undefined) next.flag = f;
        }
        return next;
      })
    );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={isImaging ? <Scan size={20} /> : <FlaskConical size={20} />}
        title={isImaging ? "Imaging Worklist" : "Laboratory Worklist"}
        description={
          isImaging
            ? "X-ray, CT and ultrasound requests from doctors: perform the study, write findings and impression, then release the report."
            : "Lab requests from doctors: receive the specimen, enter results, then release them to the ordering doctor."
        }
      />

      {error && !editing && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {(
          [
            ["todo", "To Do"],
            ["progress", "In Progress"],
            ["released", "Released"],
            ["all", "All"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              tab === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, test, doctor..."
              className={`${ui.input} pl-8`}
            />
          </div>
          {!canWork && <span className="text-[11px] text-slate-500">View only</span>}
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Ordered</th>
                <th className={ui.th}>Priority</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>{isImaging ? "Study" : "Test"}</th>
                <th className={ui.th}>{isImaging ? "Modality" : "Category / Specimen"}</th>
                <th className={ui.th}>Ordering Doctor</th>
                <th className={ui.th}>Status</th>
                <th className={`${ui.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rowsShown.length === 0 && (
                <tr>
                  <td colSpan={8} className={ui.emptyCell}>
                    {tab === "todo" ? "No new requests. 🎉" : "Nothing here."}
                  </td>
                </tr>
              )}
              {rowsShown.map(l => (
                <tr key={l.id} className={ui.tr}>
                  <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(l.orderedAt || l.date)}</td>
                  <td className={ui.td}>
                    <span
                      className={`${ui.badge} ${
                        l.priority === "STAT"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : l.priority === "Urgent"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {l.priority || "Routine"}
                    </span>
                  </td>
                  <td className={ui.td}>
                    <div className="font-bold text-slate-900 whitespace-nowrap">{l.patientName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{l.patientId}</div>
                  </td>
                  <td className={ui.td}>
                    <div className="font-semibold text-slate-900">{l.test}</div>
                    {l.indication && <div className="text-[10px] text-slate-500">For: {l.indication}</div>}
                  </td>
                  <td className={ui.td}>
                    {isImaging ? l.specimenType || "—" : l.category}
                    {!isImaging && <div className="text-[10px] text-slate-400">{l.specimenType}</div>}
                  </td>
                  <td className={`${ui.td} whitespace-nowrap`}>{l.orderingPhysician}</td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${statusStyle[l.status]}`}>{statusLabel[l.status]}</span>
                    {l.performedBy && <div className="text-[10px] text-slate-400 mt-1">{l.performedBy}</div>}
                  </td>
                  <td className={`${ui.td} text-right whitespace-nowrap`}>
                    {l.status === "Ready" || !canWork ? (
                      <button onClick={() => setViewing(l)} className="text-emerald-700 font-bold hover:underline cursor-pointer">
                        View
                      </button>
                    ) : l.status === "Pending Analysis" ? (
                      <button onClick={() => receive(l)} className={ui.primaryBtn}>
                        {isImaging ? "Start Study" : "Receive Specimen"}
                      </button>
                    ) : (
                      <button onClick={() => openResults(l)} className={ui.primaryBtn}>
                        {isImaging ? "Write Report" : "Enter Results"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal
          wide
          title={`${isImaging ? "Imaging Report" : "Lab Results"} — ${editing.test}`}
          subtitle={`${editing.patientName} (${editing.patientId}) • ordered by ${editing.orderingPhysician}${
            editing.indication ? ` • for ${editing.indication}` : ""
          }`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" onClick={() => setEditing(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="button" onClick={() => save(false)} disabled={busy} className={ui.secondaryBtn}>
                Save Draft
              </button>
              <button type="button" onClick={() => save(true)} disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Release to Doctor"}
              </button>
            </>
          }
        >
          {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
          {isImaging ? (
            <>
              <div>
                <label className={ui.label}>Findings *</label>
                <textarea
                  rows={6}
                  value={findings}
                  onChange={e => setFindings(e.target.value)}
                  placeholder="Describe what the study shows, region by region."
                  className={ui.input}
                />
              </div>
              <div>
                <label className={ui.label}>Impression *</label>
                <textarea
                  rows={3}
                  value={interpretation}
                  onChange={e => setInterpretation(e.target.value)}
                  placeholder="e.g. No acute cardiopulmonary findings."
                  className={ui.input}
                />
              </div>
            </>
          ) : (
            <>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className={ui.table}>
                  <thead className={ui.thead}>
                    <tr>
                      <th className={ui.th}>Parameter</th>
                      <th className={ui.th}>Result</th>
                      <th className={ui.th}>Unit</th>
                      <th className={ui.th}>Reference Range</th>
                      <th className={ui.th}>Flag</th>
                      <th className={ui.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="p-1.5">
                          <input value={r.name} onChange={e => setRow(i, { name: e.target.value })} placeholder="Hemoglobin" className={ui.input} />
                        </td>
                        <td className="p-1.5">
                          <input value={r.value} onChange={e => setRow(i, { value: e.target.value })} placeholder="13.8" className={`${ui.input} font-mono`} />
                        </td>
                        <td className="p-1.5">
                          <input value={r.unit || ""} onChange={e => setRow(i, { unit: e.target.value })} placeholder="g/dL" className={ui.input} />
                        </td>
                        <td className="p-1.5">
                          <input value={r.ref} onChange={e => setRow(i, { ref: e.target.value })} placeholder="12.0–16.0" className={`${ui.input} font-mono`} />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={r.flag || ""}
                            onChange={e => setRow(i, { flag: (e.target.value || null) as LabTestItem["flag"] })}
                            className={ui.input}
                          >
                            <option value="">Normal</option>
                            <option value="H">High</option>
                            <option value="L">Low</option>
                            <option value="HH">Critical High</option>
                            <option value="LL">Critical Low</option>
                          </select>
                        </td>
                        <td className="p-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => setRows(rs => rs.filter((_, idx) => idx !== i))}
                            aria-label="Remove row"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 inline-flex items-center justify-center cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setRows(rs => [...rs, blankRow()])} className={ui.secondaryBtn}>
                <Plus size={13} /> Add Row
              </button>
              <div>
                <label className={ui.label}>Interpretation / Remarks</label>
                <textarea rows={2} value={interpretation} onChange={e => setInterpretation(e.target.value)} className={ui.input} />
              </div>
            </>
          )}
          <p className="text-slate-500">
            Released as <span className="font-bold text-slate-700">{signature}</span>
          </p>
        </Modal>
      )}

      {viewing && (
        <Modal
          wide
          title={`${viewing.test} — ${viewing.patientName}`}
          subtitle={`Ordered ${dt(viewing.orderedAt || viewing.date)} by ${viewing.orderingPhysician}${
            viewing.releasedBy ? ` • released ${viewing.releasedAt || ""} by ${viewing.releasedBy}` : ""
          }`}
          onClose={() => setViewing(null)}
        >
          {viewing.findings && (
            <div>
              <div className={ui.label}>Findings</div>
              <p className="whitespace-pre-line text-slate-800">{viewing.findings}</p>
            </div>
          )}
          {viewing.items.length > 0 && (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <LabResultsTable items={viewing.items} />
            </div>
          )}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700">{viewing.findings ? "Impression" : "Interpretation"}: </span>
            {viewing.summary || "—"}
          </div>
          {viewing.status === "Ready" && (
            <div className="text-right">
              <PrintReportButton lab={viewing} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
