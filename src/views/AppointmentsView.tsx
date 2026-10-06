import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { Appointment } from "../types";
import { timestamp, uid } from "../services/ids";
import { useCollection } from "../hooks/useCollection";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import * as ui from "../components/tableStyles";
import { Calendar, Search } from "../components/Icons";
import { fmtTime, timeSlots } from "../services/time";
import { useConfirm } from "../components/ConfirmDialog";

const statusStyle: Record<Appointment["status"], string> = {
  Scheduled: "bg-sky-50 text-sky-700 border-sky-200",
  "Checked In": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-slate-50 text-slate-600 border-slate-200",
  Cancelled: "bg-slate-50 text-slate-400 border-slate-200",
  "No-show": "bg-rose-50 text-rose-700 border-rose-200",
};

/** Appointment scheduling: the front desk books and checks in patients; doctors see their own schedule. */
export default function AppointmentsView() {
  const { user } = useAuth();
  const { patients, usersList, checkInPatient } = useOpdData();
  const appts = useCollection<Appointment>("appointments");
  const confirm = useConfirm();
  const canBook = user?.role === "staff";
  const isDoctor = user?.role === "doctor";

  const today = timestamp().slice(0, 10);
  const [date, setDate] = useState(today);
  const [doctorFilter, setDoctorFilter] = useState(isDoctor ? user!.id : "all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const doctors = usersList.filter(u => u.role === "doctor" && u.status !== "suspended");
  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(n => (n === msg ? null : n)), 4000);
  };

  const q = search.toLowerCase();
  const rows = appts.items
    .filter(a => !date || a.date === date)
    .filter(a => doctorFilter === "all" || a.doctorId === doctorFilter)
    .filter(a => !q || [a.patientName, a.patientId || "", a.reason, a.doctorName].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const startNew = () => {
    setError(null);
    setDraft({
      id: "",
      patientName: "",
      doctorId: doctors[0]?.id || "",
      doctorName: doctors[0]?.name || "",
      date: date || today,
      time: "09:00",
      reason: "",
      status: "Scheduled",
      createdBy: user.name,
      createdAt: "",
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.patientName.trim() || !draft.doctorId || !draft.date || !draft.time) return setError("Enter the patient, doctor, date and time.");
    if (!draft.id && draft.date < today) return setError("The appointment date is in the past.");
    const clash = appts.items.find(
      a => a.id !== draft.id && a.doctorId === draft.doctorId && a.date === draft.date && a.time === draft.time && (a.status === "Scheduled" || a.status === "Checked In")
    );
    if (clash) return setError(`${draft.doctorName} already has ${clash.patientName} at ${fmtTime(draft.time)}. Choose another time.`);
    const item: Appointment = { ...draft, id: draft.id || `APT-${uid()}`, patientName: draft.patientName.trim(), reason: draft.reason.trim(), createdAt: draft.createdAt || timestamp().slice(0, 16) };
    setBusy(true);
    const err = await appts.save(item, `${draft.id ? "Rescheduled" : "Booked"} appointment with ${item.doctorName} on ${item.date} ${fmtTime(item.time)}`, {
      patientId: item.patientId,
      patientName: item.patientName,
    });
    setBusy(false);
    if (err) return setError(err);
    setDraft(null);
    setDate(item.date);
    flash(`Appointment saved for ${item.patientName}.`);
  };

  const setStatus = async (a: Appointment, status: Appointment["status"]) => {
    setError(null);
    if (status === "Checked In") {
      if (!a.patientId) return setError(`${a.patientName} is not registered yet. Register the patient first, then link them to this appointment (Edit).`);
      const qErr = checkInPatient(a.patientId, a.doctorName, a.reason);
      if (qErr) return setError(qErr);
    }
    if (
      status === "Cancelled" &&
      !(await confirm({ title: "Cancel appointment?", message: `${a.patientName} — ${a.date} with ${a.doctorName}.`, confirmText: "Cancel Appointment", cancelText: "Keep", tone: "danger" }))
    )
      return;
    const err = await appts.save({ ...a, status }, `Appointment ${a.id} → ${status}`, { patientId: a.patientId, patientName: a.patientName });
    if (err) return setError(err);
    flash(status === "Checked In" ? `${a.patientName} checked in and added to ${a.doctorName}'s queue.` : `Appointment marked ${status}.`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Calendar size={20} />}
        title={isDoctor ? "My Appointments" : "Appointments"}
        description={isDoctor ? "Patients booked to see you." : "Book consultations with doctors. When the patient arrives, click Check In to put them in the doctor's queue."}
        actions={
          canBook ? (
            <button onClick={startNew} className={ui.primaryBtn}>
              + Book Appointment
            </button>
          ) : undefined
        }
      />
      {notice && <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">{notice}</div>}
      {(error || appts.error) && !draft && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error || appts.error}</div>}

      <div className={ui.tableWrap}>
        <div className={`${ui.toolbar} flex-wrap`}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${ui.input} w-auto`} />
          <button onClick={() => setDate("")} className={ui.secondaryBtn}>
            All dates
          </button>
          <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} className={`${ui.input} w-auto`}>
            <option value="all">All doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, reason..." className={`${ui.input} pl-8`} />
          </div>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Date / Time</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Doctor</th>
                <th className={ui.th}>Reason</th>
                <th className={ui.th}>Status</th>
                <th className={`${ui.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {appts.loading && (
                <tr>
                  <td colSpan={6} className={ui.emptyCell}>Loading…</td>
                </tr>
              )}
              {!appts.loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={ui.emptyCell}>No appointments{date ? ` on ${date}` : ""}.</td>
                </tr>
              )}
              {rows.map(a => (
                <tr key={a.id} className={ui.tr}>
                  <td className={`${ui.td} font-mono whitespace-nowrap`}>
                    {a.date}
                    <div className="font-bold text-slate-900">{fmtTime(a.time)}</div>
                  </td>
                  <td className={ui.td}>
                    <div className="font-bold text-slate-900">{a.patientName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{a.patientId || "Not registered yet"}{a.contact ? ` • ${a.contact}` : ""}</div>
                  </td>
                  <td className={`${ui.td} whitespace-nowrap`}>{a.doctorName}</td>
                  <td className={ui.td}>{a.reason || "—"}</td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${statusStyle[a.status]}`}>{a.status}</span>
                  </td>
                  <td className={`${ui.td} text-right whitespace-nowrap`}>
                    {canBook && a.status === "Scheduled" && (
                      <>
                        <button onClick={() => setStatus(a, "Checked In")} className={`${ui.primaryBtn} mr-2`}>
                          Check In
                        </button>
                        <button
                          onClick={() => {
                            setError(null);
                            setDraft({ ...a });
                          }}
                          className="text-slate-600 font-bold hover:underline cursor-pointer mr-2"
                        >
                          Edit
                        </button>
                        <button onClick={() => setStatus(a, "No-show")} className="text-amber-700 font-bold hover:underline cursor-pointer mr-2">
                          No-show
                        </button>
                        <button onClick={() => setStatus(a, "Cancelled")} className="text-rose-700 font-bold hover:underline cursor-pointer">
                          Cancel
                        </button>
                      </>
                    )}
                    {(canBook || isDoctor) && a.status === "Checked In" && (
                      <button onClick={() => setStatus(a, "Completed")} className="text-emerald-700 font-bold hover:underline cursor-pointer">
                        Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <Modal
          title={draft.id ? "Edit Appointment" : "Book Appointment"}
          onClose={() => !busy && setDraft(null)}
          footer={
            <>
              <button type="button" onClick={() => setDraft(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="appt-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Save"}
              </button>
            </>
          }
        >
          <form id="appt-form" onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {error && <div className="sm:col-span-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div className="sm:col-span-2">
              <label className={ui.label}>Registered patient</label>
              <select
                value={draft.patientId || ""}
                onChange={e => {
                  const p = patients.find(x => x.id === e.target.value);
                  setDraft({ ...draft, patientId: p?.id, patientName: p?.name || draft.patientName, contact: p?.contact || draft.contact });
                }}
                className={ui.input}
              >
                <option value="">— New patient (not registered yet) —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label}>Patient name *</label>
              <input value={draft.patientName} onChange={e => setDraft({ ...draft, patientName: e.target.value })} disabled={!!draft.patientId} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Contact number</label>
              <input value={draft.contact || ""} onChange={e => setDraft({ ...draft, contact: e.target.value })} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Doctor *</label>
              <select
                value={draft.doctorId}
                onChange={e => {
                  const d = doctors.find(x => x.id === e.target.value);
                  setDraft({ ...draft, doctorId: d?.id || "", doctorName: d?.name || "" });
                }}
                className={ui.input}
              >
                {doctors.length === 0 && <option value="">No active doctors</option>}
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.department ? ` — ${d.department}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={ui.label}>Date *</label>
                <input type="date" min={draft.id ? undefined : today} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} className={ui.input} />
              </div>
              <div>
                <label className={ui.label}>Time *</label>
                <select value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })} className={ui.input}>
                  {timeSlots(6, 22).map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={ui.label}>Reason for visit</label>
              <input value={draft.reason} onChange={e => setDraft({ ...draft, reason: e.target.value })} placeholder="e.g. Follow-up, hypertension" className={ui.input} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
