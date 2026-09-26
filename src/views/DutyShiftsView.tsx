import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { useWardData } from "../context/WardDataContext";
import { DutyShift, DUTY_SHIFT_HOURS, ShiftSchedule } from "../types";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import StaffAvatar from "../components/StaffAvatar";
import { Clock, Plus, ChevronLeft, ChevronRight } from "../components/Icons";
import * as ui from "../components/tableStyles";
import { currentShift, newId, todayIso } from "./nursing/helpers";

const SHIFTS: DutyShift[] = ["Morning", "Afternoon", "Night"];

const shiftStyle: Record<DutyShift, string> = {
  Morning: "bg-amber-50 text-amber-800 border-amber-200",
  Afternoon: "bg-sky-50 text-sky-800 border-sky-200",
  Night: "bg-indigo-50 text-indigo-800 border-indigo-200",
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayIso(d);
}

function startOfWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const mondayOffset = (d.getDay() + 6) % 7;
  return addDays(iso, -mondayOffset);
}

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

export default function DutyShiftsView() {
  const { user } = useAuth();
  const { usersList } = useOpdData();
  const { shiftSchedules, saveShiftSchedule, removeShiftSchedule } = useWardData();
  const isAdmin = user?.role === "admin";

  const today = todayIso();
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const [roleFilter, setRoleFilter] = useState<"all" | "doctor" | "nurse" | "staff" | "admin">("all");
  const [draft, setDraft] = useState<{ userId: string; date: string; shift: DutyShift; area: string; notes: string; repeatDays: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const staff = usersList.filter(u => u.status !== "suspended" && (roleFilter === "all" || u.role === roleFilter));
  const weekShifts = shiftSchedules.filter(s => s.date >= days[0] && s.date <= days[6]);
  const myUpcoming = shiftSchedules
    .filter(s => s.userId === user?.id && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift));
  const nowShift = currentShift();
  const onDutyNow = shiftSchedules.filter(s => s.date === today && s.shift === nowShift);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const person = usersList.find(u => u.id === draft.userId);
    if (!person) return setError("Select a staff member.");
    if (!draft.date) return setError("Select a date.");
    const repeat = Math.min(31, Math.max(1, Number(draft.repeatDays) || 1));
    const entries: ShiftSchedule[] = Array.from({ length: repeat }, (_, i) => ({
      id: newId("SHF"),
      userId: person.id,
      staffName: person.name,
      role: person.role,
      date: addDays(draft.date, i),
      shift: draft.shift,
      area: draft.area.trim() || person.department,
      assignedBy: user.name,
      notes: draft.notes.trim() || undefined,
    }));
    const clash = entries.find(en => shiftSchedules.some(s => s.userId === en.userId && s.date === en.date && s.shift === en.shift));
    if (clash) return setError(`${person.name} already has the ${clash.shift} shift on ${clash.date}.`);
    setBusy(true);
    try {
      for (const en of entries) await saveShiftSchedule(en);
      setDraft(null);
    } catch {
      setError("Could not save the shift. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = (s: ShiftSchedule) => {
    if (!window.confirm(`Remove ${s.staffName}'s ${s.shift} shift on ${s.date}?`)) return;
    removeShiftSchedule(s.id).catch(() => window.alert("Could not remove the shift. Please try again."));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Clock size={20} />}
        title="Duty Shifts"
        description={`Morning ${DUTY_SHIFT_HOURS.Morning} • Afternoon ${DUTY_SHIFT_HOURS.Afternoon} • Night ${DUTY_SHIFT_HOURS.Night}`}
        actions={
          isAdmin && (
            <button
              onClick={() => {
                setError(null);
                setDraft({ userId: usersList[0]?.id || "", date: today, shift: "Morning", area: "", notes: "", repeatDays: "1" });
              }}
              className={ui.primaryBtn}
            >
              <Plus size={14} /> Assign Shift
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My upcoming shifts */}
        <div className={ui.tableWrap}>
          <div className={ui.toolbar}>
            <h3 className="text-sm font-bold text-slate-900">My Upcoming Shifts</h3>
          </div>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Date</th>
                <th className={ui.th}>Shift</th>
                <th className={ui.th}>Hours</th>
                <th className={ui.th}>Area</th>
              </tr>
            </thead>
            <tbody>
              {myUpcoming.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.emptyCell}>
                    No upcoming shifts assigned to you.
                  </td>
                </tr>
              )}
              {myUpcoming.slice(0, 7).map(s => (
                <tr key={s.id} className={ui.tr}>
                  <td className={`${ui.td} whitespace-nowrap font-semibold`}>
                    {dayLabel(s.date)}
                    {s.date === today && <span className="ml-1.5 text-emerald-700">(Today)</span>}
                  </td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${shiftStyle[s.shift]}`}>{s.shift}</span>
                  </td>
                  <td className={`${ui.td} font-mono`}>{DUTY_SHIFT_HOURS[s.shift]}</td>
                  <td className={ui.td}>{s.area}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* On duty now */}
        <div className={ui.tableWrap}>
          <div className={ui.toolbar}>
            <h3 className="text-sm font-bold text-slate-900">
              On Duty Now — <span className="text-emerald-700">{nowShift} Shift</span>
            </h3>
          </div>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Staff</th>
                <th className={ui.th}>Role</th>
                <th className={ui.th}>Area</th>
              </tr>
            </thead>
            <tbody>
              {onDutyNow.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.emptyCell}>
                    Nobody is scheduled for the current shift.
                  </td>
                </tr>
              )}
              {onDutyNow.map(s => (
                <tr key={s.id} className={ui.tr}>
                  <td className={`${ui.td} font-semibold text-slate-900`}>{s.staffName}</td>
                  <td className={`${ui.td} capitalize`}>{s.role}</td>
                  <td className={ui.td}>{s.area}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly roster */}
      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Weekly Duty Roster</h3>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as typeof roleFilter)}
              className={ui.inlineInput}
            >
              <option value="all">All roles</option>
              <option value="doctor">Doctors</option>
              <option value="nurse">Nurses</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className={ui.secondaryBtn} aria-label="Previous week">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(today))} className={ui.secondaryBtn}>
              This week
            </button>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className={ui.secondaryBtn} aria-label="Next week">
              <ChevronRight size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-600 ml-1">
              {dayLabel(days[0])} – {dayLabel(days[6])}
            </span>
          </div>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={`${ui.th} sticky left-0 bg-slate-50`}>Staff</th>
                {days.map(d => (
                  <th key={d} className={`${ui.th} text-center ${d === today ? "text-emerald-700" : ""}`}>
                    {dayLabel(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={8} className={ui.emptyCell}>
                    No staff accounts yet.
                  </td>
                </tr>
              )}
              {staff.map(u => (
                <tr key={u.id} className={ui.tr}>
                  <td className={`${ui.td} sticky left-0 bg-white`}>
                    <div className="flex items-center gap-2 min-w-[170px]">
                      <StaffAvatar user={u} size={26} />
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">{u.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{u.role}</div>
                      </div>
                    </div>
                  </td>
                  {days.map(d => {
                    const cell = weekShifts.filter(s => s.userId === u.id && s.date === d);
                    return (
                      <td key={d} className={`${ui.td} text-center ${d === today ? "bg-emerald-50/40" : ""}`}>
                        {cell.length === 0 ? (
                          <span className="text-slate-300">Off</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            {cell.map(s => (
                              <span key={s.id} title={`${DUTY_SHIFT_HOURS[s.shift]} • ${s.area}`} className={`${ui.badge} ${shiftStyle[s.shift]}`}>
                                {s.shift}
                                {isAdmin && (
                                  <button
                                    onClick={() => remove(s)}
                                    className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    aria-label={`Remove ${s.shift} shift`}
                                  >
                                    ×
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <Modal
          title="Assign Duty Shift"
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" onClick={() => setDraft(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="shift-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Assign"}
              </button>
            </>
          }
        >
          <form id="shift-form" onSubmit={submit} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div>
              <label className={ui.label}>Staff Member *</label>
              <select value={draft.userId} onChange={e => setDraft({ ...draft, userId: e.target.value })} className={ui.input}>
                {usersList
                  .filter(u => u.status !== "suspended")
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>Start Date *</label>
                <input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} className={ui.input} />
              </div>
              <div>
                <label className={ui.label}>Number of Days</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={draft.repeatDays}
                  onChange={e => setDraft({ ...draft, repeatDays: e.target.value })}
                  className={ui.input}
                />
              </div>
              <div>
                <label className={ui.label}>Shift *</label>
                <select
                  value={draft.shift}
                  onChange={e => setDraft({ ...draft, shift: e.target.value as DutyShift })}
                  className={ui.input}
                >
                  {SHIFTS.map(s => (
                    <option key={s} value={s}>
                      {s} ({DUTY_SHIFT_HOURS[s]})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>Area / Station</label>
                <input
                  value={draft.area}
                  onChange={e => setDraft({ ...draft, area: e.target.value })}
                  placeholder="Defaults to their department"
                  className={ui.input}
                />
              </div>
            </div>
            <div>
              <label className={ui.label}>Notes</label>
              <input value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} className={ui.input} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
