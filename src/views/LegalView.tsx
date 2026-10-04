import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { PrivacyRequest } from "../types";
import { timestamp, uid } from "../services/ids";
import { useCollection } from "../hooks/useCollection";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import IncidentsView from "./IncidentsView";
import * as ui from "../components/tableStyles";
import { Scale, Search } from "../components/Icons";

type Tab = "incidents" | "privacy";
const TYPES: PrivacyRequest["type"][] = ["Access to records", "Correction", "Erasure / Blocking", "Objection to processing", "Data portability", "Complaint"];
const RELATIONSHIPS: PrivacyRequest["relationship"][] = ["Patient", "Parent / Guardian", "Authorized Representative", "Other"];
const statusStyle: Record<PrivacyRequest["status"], string> = {
  Received: "bg-sky-50 text-sky-700 border-sky-200",
  "In Review": "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Denied: "bg-slate-50 text-slate-600 border-slate-200",
};

const addDays = (date: string, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Legal Counsel workspace: incident investigations and data-subject (RA 10173) requests. */
export default function LegalView() {
  const { user } = useAuth();
  const { patients } = useOpdData();
  const requests = useCollection<PrivacyRequest>("privacy_requests");
  const [tab, setTab] = useState<Tab>("incidents");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PrivacyRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const today = timestamp().slice(0, 10);
  const q = search.toLowerCase();
  const rows = requests.items
    .filter(r => !q || [r.id, r.requesterName, r.patientName || "", r.type, r.details].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => (a.status === "Completed" || a.status === "Denied" ? 1 : 0) - (b.status === "Completed" || b.status === "Denied" ? 1 : 0) || a.dueDate.localeCompare(b.dueDate));
  const openCount = requests.items.filter(r => r.status === "Received" || r.status === "In Review").length;
  const overdue = (r: PrivacyRequest) => (r.status === "Received" || r.status === "In Review") && r.dueDate < today;

  const startNew = () => {
    setError(null);
    setEditing({
      id: "",
      receivedAt: today,
      requesterName: "",
      relationship: "Patient",
      type: "Access to records",
      details: "",
      dueDate: addDays(today, 30),
      status: "Received",
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.requesterName.trim() || !editing.details.trim()) return setError("Enter the requester and the details of the request.");
    if ((editing.status === "Completed" || editing.status === "Denied") && !editing.response?.trim()) return setError("Record the response given before closing.");
    const isNew = !editing.id;
    const item: PrivacyRequest = {
      ...editing,
      id: editing.id || `DPR-${uid()}`,
      requesterName: editing.requesterName.trim(),
      details: editing.details.trim(),
      handledBy: editing.handledBy || user.name,
      closedAt: editing.status === "Completed" || editing.status === "Denied" ? editing.closedAt || timestamp().slice(0, 16) : undefined,
    };
    setBusy(true);
    const err = await requests.save(item, `${isNew ? "Logged" : "Updated"} data privacy request ${item.id} (${item.type}) → ${item.status}`, {
      patientId: item.patientId,
      patientName: item.patientName,
    });
    setBusy(false);
    if (err) return setError(err);
    setEditing(null);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Scale size={20} />}
        title="Legal & Compliance"
        description="Investigate incident reports and handle patients' data-privacy requests under RA 10173 (Data Privacy Act). The audit log is under Audit Ledger."
      />
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {(
          [
            ["incidents", "Incident Reports"],
            ["privacy", `Data Privacy Requests${openCount ? ` (${openCount} open)` : ""}`],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${tab === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "incidents" ? (
        <IncidentsView embedded />
      ) : (
        <div className={ui.tableWrap}>
          <div className={ui.toolbar}>
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..." className={`${ui.input} pl-8`} />
            </div>
            <button onClick={startNew} className={ui.primaryBtn}>
              + Log Request
            </button>
          </div>
          {requests.error && <div className="px-4 py-2 text-xs font-semibold text-rose-700">{requests.error}</div>}
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>Received</th>
                  <th className={ui.th}>Requester</th>
                  <th className={ui.th}>Request</th>
                  <th className={ui.th}>Due</th>
                  <th className={ui.th}>Status</th>
                  <th className={`${ui.th} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.loading && (
                  <tr>
                    <td colSpan={6} className={ui.emptyCell}>Loading…</td>
                  </tr>
                )}
                {!requests.loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className={ui.emptyCell}>No data privacy requests logged.</td>
                  </tr>
                )}
                {rows.map(r => (
                  <tr key={r.id} className={ui.tr}>
                    <td className={`${ui.td} font-mono whitespace-nowrap`}>
                      {r.receivedAt}
                      <div className="text-[10px] text-slate-400">{r.id}</div>
                    </td>
                    <td className={ui.td}>
                      <div className="font-bold text-slate-900">{r.requesterName}</div>
                      <div className="text-[10px] text-slate-500">
                        {r.relationship}
                        {r.patientName ? ` of ${r.patientName}` : ""}
                      </div>
                    </td>
                    <td className={ui.td}>
                      <div className="font-semibold">{r.type}</div>
                      <div className="text-[10px] text-slate-500 max-w-[320px] line-clamp-2">{r.details}</div>
                    </td>
                    <td className={`${ui.td} font-mono whitespace-nowrap ${overdue(r) ? "text-rose-700 font-bold" : ""}`}>
                      {r.dueDate}
                      {overdue(r) && <div className="text-[10px]">OVERDUE</div>}
                    </td>
                    <td className={ui.td}>
                      <span className={`${ui.badge} ${statusStyle[r.status]}`}>{r.status}</span>
                    </td>
                    <td className={`${ui.td} text-right`}>
                      <button
                        onClick={() => {
                          setError(null);
                          setEditing({ ...r });
                        }}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <Modal
          wide
          title={editing.id ? `Privacy Request ${editing.id}` : "Log Data Privacy Request"}
          subtitle="Respond within the due date (default 30 days). Verify the requester's identity before releasing any record."
          onClose={() => !busy && setEditing(null)}
          footer={
            <>
              <button type="button" onClick={() => setEditing(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="privacy-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Save"}
              </button>
            </>
          }
        >
          <form id="privacy-form" onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {error && <div className="sm:col-span-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div>
              <label className={ui.label}>Requester name *</label>
              <input value={editing.requesterName} onChange={e => setEditing({ ...editing, requesterName: e.target.value })} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Relationship to patient</label>
              <select value={editing.relationship} onChange={e => setEditing({ ...editing, relationship: e.target.value as PrivacyRequest["relationship"] })} className={ui.input}>
                {RELATIONSHIPS.map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label}>Patient</label>
              <select
                value={editing.patientId || ""}
                onChange={e => {
                  const p = patients.find(x => x.id === e.target.value);
                  setEditing({ ...editing, patientId: p?.id, patientName: p?.name });
                }}
                className={ui.input}
              >
                <option value="">— Not linked —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label}>Type of request</label>
              <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as PrivacyRequest["type"] })} className={ui.input}>
                {TYPES.map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label}>Date received</label>
              <input
                type="date"
                value={editing.receivedAt}
                onChange={e => setEditing({ ...editing, receivedAt: e.target.value, dueDate: editing.id ? editing.dueDate : addDays(e.target.value, 30) })}
                className={ui.input}
              />
            </div>
            <div>
              <label className={ui.label}>Respond by</label>
              <input type="date" value={editing.dueDate} onChange={e => setEditing({ ...editing, dueDate: e.target.value })} className={ui.input} />
            </div>
            <div className="sm:col-span-2">
              <label className={ui.label}>Details *</label>
              <textarea value={editing.details} onChange={e => setEditing({ ...editing, details: e.target.value })} rows={3} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Status</label>
              <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as PrivacyRequest["status"] })} className={ui.input}>
                {(["Received", "In Review", "Completed", "Denied"] as PrivacyRequest["status"][]).map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label}>Handled by</label>
              <input value={editing.handledBy || ""} onChange={e => setEditing({ ...editing, handledBy: e.target.value })} placeholder={user.name} className={ui.input} />
            </div>
            <div className="sm:col-span-2">
              <label className={ui.label}>Response given {(editing.status === "Completed" || editing.status === "Denied") && "*"}</label>
              <textarea value={editing.response || ""} onChange={e => setEditing({ ...editing, response: e.target.value })} rows={3} className={ui.input} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
