import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { IncidentReport, ROLE_LABELS } from "../types";
import { timestamp, uid } from "../services/ids";
import { useCollection } from "../hooks/useCollection";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import * as ui from "../components/tableStyles";
import { AlertTriangle, Search } from "../components/Icons";

const CATEGORIES: IncidentReport["category"][] = ["Patient Safety", "Medication Error", "Fall / Injury", "Data Privacy Breach", "Equipment", "Staff Conduct", "Other"];
const SEVERITIES: IncidentReport["severity"][] = ["Low", "Moderate", "High", "Sentinel"];
const sevStyle: Record<IncidentReport["severity"], string> = {
  Low: "bg-slate-50 text-slate-600 border-slate-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-rose-50 text-rose-700 border-rose-200",
  Sentinel: "bg-rose-600 text-white border-rose-700",
};
const statusStyle: Record<IncidentReport["status"], string> = {
  Open: "bg-sky-50 text-sky-700 border-sky-200",
  "Under Investigation": "bg-amber-50 text-amber-700 border-amber-200",
  Closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/**
 * Incident reports. Every staff member can file one and follow their own reports;
 * Legal Counsel and the Administrator see all of them and investigate / close them.
 * `embedded` hides the page header (used inside Legal & Compliance).
 */
export default function IncidentsView({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { patients } = useOpdData();
  const incidents = useCollection<IncidentReport>("incident_reports");
  const manager = user?.role === "legal" || user?.role === "admin";

  const [filter, setFilter] = useState<"active" | "all">("active");
  const [search, setSearch] = useState("");
  const [filing, setFiling] = useState<IncidentReport | null>(null);
  const [reviewing, setReviewing] = useState<IncidentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(n => (n === msg ? null : n)), 4000);
  };

  const q = search.toLowerCase();
  const rows = incidents.items
    .filter(i => manager || i.reporterId === user.id)
    .filter(i => filter === "all" || i.status !== "Closed")
    .filter(i => !q || [i.id, i.category, i.description, i.reportedBy, i.patientName || "", i.location].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

  const startFiling = () => {
    setError(null);
    setFiling({
      id: "",
      reportedAt: "",
      reportedBy: user.name,
      reporterId: user.id,
      reporterRole: user.role,
      occurredAt: timestamp().slice(0, 16).replace(" ", "T"),
      location: "",
      category: "Patient Safety",
      severity: "Moderate",
      description: "",
      immediateAction: "",
      status: "Open",
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filing) return;
    if (!filing.location.trim() || !filing.description.trim()) return setError("Enter where it happened and what happened.");
    const report: IncidentReport = {
      ...filing,
      id: `INC-${uid()}`,
      reportedAt: timestamp().slice(0, 16),
      occurredAt: filing.occurredAt.replace("T", " "),
      location: filing.location.trim(),
      description: filing.description.trim(),
      immediateAction: filing.immediateAction?.trim() || undefined,
    };
    setBusy(true);
    const err = await incidents.add(report, `Filed incident report ${report.id} (${report.category}, ${report.severity})`, {
      patientId: report.patientId,
      patientName: report.patientName,
    });
    setBusy(false);
    if (err) return setError(err);
    setFiling(null);
    flash(`Incident ${report.id} filed. Legal Counsel has been notified on their dashboard.`);
  };

  const saveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewing) return;
    if (reviewing.status === "Closed" && !reviewing.resolution?.trim()) return setError("Enter the resolution before closing.");
    const updated: IncidentReport = {
      ...reviewing,
      assignedTo: reviewing.assignedTo || user.name,
      closedAt: reviewing.status === "Closed" ? reviewing.closedAt || timestamp().slice(0, 16) : undefined,
    };
    setBusy(true);
    const err = await incidents.save(updated, `Incident ${updated.id} → ${updated.status}`, { patientId: updated.patientId, patientName: updated.patientName });
    setBusy(false);
    if (err) return setError(err);
    setReviewing(null);
    flash(`Incident ${updated.id} updated.`);
  };

  return (
    <div className={embedded ? "space-y-4" : "space-y-4 max-w-7xl mx-auto pb-10"}>
      {!embedded && (
        <PageHeader
          icon={<AlertTriangle size={20} />}
          title="Incident Reports"
          description="Report a patient-safety event, medication error, fall, equipment problem or data-privacy breach. Legal Counsel reviews every report."
          actions={
            <button onClick={startFiling} className={ui.primaryBtn}>
              + Report an Incident
            </button>
          }
        />
      )}
      {notice && <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">{notice}</div>}
      {incidents.error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{incidents.error}</div>}

      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..." className={`${ui.input} pl-8`} />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value as "active" | "all")} className={`${ui.input} w-auto`}>
            <option value="active">Open &amp; under investigation</option>
            <option value="all">All, including closed</option>
          </select>
          {embedded && (
            <button onClick={startFiling} className={ui.primaryBtn}>
              + Report an Incident
            </button>
          )}
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Reported</th>
                <th className={ui.th}>Category</th>
                <th className={ui.th}>Severity</th>
                <th className={ui.th}>What happened</th>
                <th className={ui.th}>Reported by</th>
                <th className={ui.th}>Status</th>
                <th className={`${ui.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.loading && (
                <tr>
                  <td colSpan={7} className={ui.emptyCell}>Loading…</td>
                </tr>
              )}
              {!incidents.loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className={ui.emptyCell}>{manager ? "No incident reports." : "You have not filed any incident reports."}</td>
                </tr>
              )}
              {rows.map(i => (
                <tr key={i.id} className={ui.tr}>
                  <td className={`${ui.td} font-mono whitespace-nowrap`}>
                    {i.reportedAt}
                    <div className="text-[10px] text-slate-400">{i.id}</div>
                  </td>
                  <td className={ui.td}>{i.category}</td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${sevStyle[i.severity]}`}>{i.severity}</span>
                  </td>
                  <td className={ui.td}>
                    <div className="max-w-[340px] line-clamp-2">{i.description}</div>
                    <div className="text-[10px] text-slate-500">
                      {i.location} • occurred {i.occurredAt}
                      {i.patientName ? ` • patient ${i.patientName}` : ""}
                    </div>
                  </td>
                  <td className={ui.td}>
                    {i.reportedBy}
                    <div className="text-[10px] text-slate-500">{ROLE_LABELS[i.reporterRole]}</div>
                  </td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${statusStyle[i.status]}`}>{i.status}</span>
                    {i.assignedTo && <div className="text-[10px] text-slate-500 mt-1">{i.assignedTo}</div>}
                  </td>
                  <td className={`${ui.td} text-right`}>
                    <button
                      onClick={() => {
                        setError(null);
                        setReviewing({ ...i });
                      }}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {manager && i.status !== "Closed" ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filing && (
        <Modal
          title="Report an Incident"
          subtitle="Describe facts only. Reports are confidential and used to prevent the same thing from happening again."
          onClose={() => !busy && setFiling(null)}
          footer={
            <>
              <button type="button" onClick={() => setFiling(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="incident-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Submitting..." : "Submit Report"}
              </button>
            </>
          }
        >
          <form id="incident-form" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {error && <div className="sm:col-span-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div>
              <label className={ui.label}>Category</label>
              <select value={filing.category} onChange={e => setFiling({ ...filing, category: e.target.value as IncidentReport["category"] })} className={ui.input}>
                {CATEGORIES.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label}>Severity</label>
              <select value={filing.severity} onChange={e => setFiling({ ...filing, severity: e.target.value as IncidentReport["severity"] })} className={ui.input}>
                {SEVERITIES.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label}>When did it happen? *</label>
              <input type="datetime-local" value={filing.occurredAt} onChange={e => setFiling({ ...filing, occurredAt: e.target.value })} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Where? *</label>
              <input value={filing.location} onChange={e => setFiling({ ...filing, location: e.target.value })} placeholder="e.g. Ward 3, Bed 12" className={ui.input} />
            </div>
            <div className="sm:col-span-2">
              <label className={ui.label}>Patient involved (if any)</label>
              <select
                value={filing.patientId || ""}
                onChange={e => {
                  const p = patients.find(x => x.id === e.target.value);
                  setFiling({ ...filing, patientId: p?.id, patientName: p?.name });
                }}
                className={ui.input}
              >
                <option value="">— None —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={ui.label}>What happened? *</label>
              <textarea value={filing.description} onChange={e => setFiling({ ...filing, description: e.target.value })} rows={4} className={ui.input} />
            </div>
            <div className="sm:col-span-2">
              <label className={ui.label}>Immediate action taken</label>
              <textarea value={filing.immediateAction || ""} onChange={e => setFiling({ ...filing, immediateAction: e.target.value })} rows={2} className={ui.input} />
            </div>
          </form>
        </Modal>
      )}

      {reviewing && (
        <Modal
          wide
          title={`Incident ${reviewing.id}`}
          subtitle={`${reviewing.category} • ${reviewing.severity} • reported ${reviewing.reportedAt} by ${reviewing.reportedBy} (${ROLE_LABELS[reviewing.reporterRole]})`}
          onClose={() => !busy && setReviewing(null)}
          footer={
            manager ? (
              <>
                <button type="button" onClick={() => setReviewing(null)} className={ui.secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" form="incident-review" disabled={busy} className={ui.primaryBtn}>
                  {busy ? "Saving..." : "Save"}
                </button>
              </>
            ) : undefined
          }
        >
          {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div>
              <b>When / where:</b> {reviewing.occurredAt} • {reviewing.location}
            </div>
            {reviewing.patientName && (
              <div>
                <b>Patient:</b> {reviewing.patientName} ({reviewing.patientId})
              </div>
            )}
            <div className="whitespace-pre-line">
              <b>What happened:</b> {reviewing.description}
            </div>
            {reviewing.immediateAction && (
              <div className="whitespace-pre-line">
                <b>Immediate action:</b> {reviewing.immediateAction}
              </div>
            )}
          </div>
          {manager ? (
            <form id="incident-review" onSubmit={saveReview} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>Status</label>
                <select value={reviewing.status} onChange={e => setReviewing({ ...reviewing, status: e.target.value as IncidentReport["status"] })} className={ui.input}>
                  {(["Open", "Under Investigation", "Closed"] as IncidentReport["status"][]).map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>Investigator</label>
                <input value={reviewing.assignedTo || ""} onChange={e => setReviewing({ ...reviewing, assignedTo: e.target.value })} placeholder={user.name} className={ui.input} />
              </div>
              <div className="sm:col-span-2">
                <label className={ui.label}>Findings &amp; resolution {reviewing.status === "Closed" && "*"}</label>
                <textarea value={reviewing.resolution || ""} onChange={e => setReviewing({ ...reviewing, resolution: e.target.value })} rows={4} className={ui.input} />
              </div>
            </form>
          ) : (
            <div className="p-3 rounded-lg border border-slate-200">
              <b>Status:</b> {reviewing.status}
              {reviewing.resolution && <div className="mt-1 whitespace-pre-line">{reviewing.resolution}</div>}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
