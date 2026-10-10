import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { useWardData } from "../context/WardDataContext";
import { DutyShift, DUTY_SHIFT_HOURS, ShiftSchedule, ROLE_LABELS, ALL_ROLES, Role, SHIFT_TIMES, shiftsForRole, shiftInterval, isOnDuty } from "../types";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import StaffAvatar from "../components/StaffAvatar";
import { Clock, Plus, ChevronLeft, ChevronRight } from "../components/Icons";
import * as ui from "../components/tableStyles";
import { currentShift, newId, todayIso } from "./nursing/helpers";
import { useConfirm } from "../components/ConfirmDialog";

const SHIFTS: DutyShift[] = ["Day Duty", "Morning", "Afternoon", "Night Duty", "Night"];

const shiftStyle: Record<DutyShift, string> = {
  Morning: "bg-amber-50 text-amber-800 border-amber-200",
  Afternoon: "bg-sky-50 text-sky-800 border-sky-200",
  Night: "bg-indigo-50 text-indigo-800 border-indigo-200",
  "Day Duty": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Night Duty": "bg-violet-50 text-violet-800 border-violet-200",
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayIso(d);
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);
}

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

/** Work-day picker order (Monday first); values are Date.getDay() numbers. */
const WEEKDAYS: [number, string][] = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [0, "Sun"],
];
const PATTERNS: [string, number[]][] = [
  ["Mon – Fri", [1, 2, 3, 4, 5]],
  ["Mon / Wed / Fri", [1, 3, 5]],
  ["Tue / Thu / Sat", [2, 4, 6]],
  ["Every day", [0, 1, 2, 3, 4, 5, 6]],
];
const MAX_RANGE_DAYS = 92;

/** Every date from `from` to `until` (inclusive) that falls on one of the chosen weekdays. */
function patternDates(from: string, until: string, weekdays: number[]): string[] {
  const out: string[] = [];
  for (let d = from; d <= until && out.length <= MAX_RANGE_DAYS; d = addDays(d, 1)) {
    if (weekdays.includes(new Date(`${d}T00:00:00`).getDay())) out.push(d);
  }
  return out;
}

type ShiftDraft = { userId: string; from: string; until: string; weekdays: number[]; shift: DutyShift; area: string; notes: string };

export default function DutyShiftsView() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const { usersList } = useOpdData();
  const { shiftSchedules, saveShiftSchedule, removeShiftSchedule } = useWardData();
  const isAdmin = user?.role === "admin";

  // Re-render every minute so "today", the roster and "On Duty Now" follow the clock (also past midnight)
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  const today = todayIso();
  // The roster shows 7 days starting today; the arrows move it a week at a time
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(today, weekOffset);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [draft, setDraft] = useState<ShiftDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const staff = usersList.filter(u => u.status !== "suspended" && (roleFilter === "all" || u.role === roleFilter));
  const weekShifts = shiftSchedules.filter(s => s.date >= days[0] && s.date <= days[6]);
  const myUpcoming = shiftSchedules
    .filter(s => s.userId === user?.id && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift));
  const nowShift = currentShift();
  const yesterday = addDays(today, -1);
  const onDutyNow = shiftSchedules.filter(s => (s.date === today || s.date === yesterday) && isOnDuty(s));

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const person = usersList.find(u => u.id === draft.userId);
    if (!person) return setError("Select a staff member.");
    if (draft.weekdays.length === 0) return setError("Pick the work days (for example Mon, Wed and Fri).");
    if (!draft.from || !draft.until) return setError("Select the From and Until dates.");
    if (draft.until < draft.from) return setError("The Until date is before the From date.");
    if (addDays(draft.from, MAX_RANGE_DAYS) < draft.until) return setError(`Schedule at most ${MAX_RANGE_DAYS} days (about 3 months) at a time.`);
    const dates = patternDates(draft.from, draft.until, draft.weekdays);
    if (dates.length === 0) return setError("None of the chosen work days fall between these dates.");
    const entries: ShiftSchedule[] = dates.map(date => ({
      id: newId("SHF"),
      userId: person.id,
      staffName: person.name,
      role: person.role,
      date,
      shift: draft.shift,
      area: draft.area.trim() || person.department,
      assignedBy: user.name,
      notes: draft.notes.trim() || undefined,
    }));
    if (!shiftsForRole(person.role).includes(draft.shift)) {
      return setError(`${ROLE_LABELS[person.role]} staff take ${shiftsForRole(person.role).join(" / ")} shifts.`);
    }
    // No two shifts of the same person may overlap in time (including overnight shifts)
    let clash: { en: ShiftSchedule; s: ShiftSchedule } | undefined;
    for (const en of entries) {
      const [a1, b1] = shiftInterval(en.date, en.shift);
      const s = shiftSchedules.find(x => {
        if (x.userId !== en.userId) return false;
        const [a2, b2] = shiftInterval(x.date, x.shift);
        return a1 < b2 && a2 < b1;
      });
      if (s) {
        clash = { en, s };
        break;
      }
    }
    if (clash) return setError(`${person.name} already has the ${clash.s.shift} shift on ${dayLabel(clash.s.date)}, which overlaps. Remove it first or change the days.`);
    setBusy(true);
    try {
      for (const en of entries) await saveShiftSchedule(en);
      setWeekOffset(daysBetween(today, draft.from));
      setDraft(null);
    } catch {
      setError("Could not save the shift. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: ShiftSchedule) => {
    if (!(await confirm({ title: "Remove shift?", message: `${s.staffName} — ${s.shift} (${DUTY_SHIFT_HOURS[s.shift]}) on ${s.date}.`, confirmText: "Remove", tone: "danger" }))) return;
    removeShiftSchedule(s.id).catch(() => confirm({ title: "Not saved", message: "Could not remove the shift. Please try again.", alertOnly: true }));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Clock size={20} />}
        title="Duty Shifts"
        description={`Nurses & other staff (8 hours): Morning ${DUTY_SHIFT_HOURS.Morning} • Afternoon ${DUTY_SHIFT_HOURS.Afternoon} • Night ${DUTY_SHIFT_HOURS.Night}. Doctors (12 hours): Day ${DUTY_SHIFT_HOURS["Day Duty"]} • Night ${DUTY_SHIFT_HOURS["Night Duty"]}.`}
        actions={
          isAdmin && (
            <button
              onClick={() => {
                setError(null);
                setDraft({
                  userId: usersList[0]?.id || "",
                  from: today,
                  until: addDays(today, 27),
                  weekdays: [],
                  shift: shiftsForRole(usersList[0]?.role || "nurse")[0],
                  area: "",
                  notes: "",
                });
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
              On Duty Now <span className="text-slate-500 font-semibold">(nurses: {nowShift} shift, {DUTY_SHIFT_HOURS[nowShift]})</span>
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
                  <td className={ui.td}>{ROLE_LABELS[s.role]}</td>
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
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setWeekOffset(weekOffset - 7)} className={ui.secondaryBtn} aria-label="Previous 7 days">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setWeekOffset(0)} disabled={weekOffset === 0} className={`${ui.secondaryBtn} disabled:opacity-50 disabled:cursor-default`}>
              Today
            </button>
            <button onClick={() => setWeekOffset(weekOffset + 7)} className={ui.secondaryBtn} aria-label="Next 7 days">
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
                  <th key={d} className={`${ui.th} text-center ${d === today ? "text-emerald-700 bg-emerald-50" : ""}`}>
                    {dayLabel(d)}
                    {d === today && <div className="text-[9px] font-extrabold text-emerald-700">TODAY</div>}
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
                        <div className="text-[10px] text-slate-400">{ROLE_LABELS[u.role]}</div>
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
              <select
                value={draft.userId}
                onChange={e => {
                  const role = usersList.find(u => u.id === e.target.value)?.role || "nurse";
                  const options = shiftsForRole(role);
                  setDraft({ ...draft, userId: e.target.value, shift: options.includes(draft.shift) ? draft.shift : options[0] });
                }}
                className={ui.input}
              >
                {usersList
                  .filter(u => u.status !== "suspended")
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {ROLE_LABELS[u.role]}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <span className={ui.label}>Work Days *</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Work days">
                {WEEKDAYS.map(([n, name]) => {
                  const on = draft.weekdays.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setError(null);
                        setDraft({ ...draft, weekdays: on ? draft.weekdays.filter(x => x !== n) : [...draft.weekdays, n] });
                      }}
                      className={`w-12 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]">
                <span className="text-slate-400">Quick pick:</span>
                {PATTERNS.map(([name, days]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDraft({ ...draft, weekdays: days });
                    }} className="font-semibold text-emerald-700 hover:underline cursor-pointer">
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>From *</label>
                <input type="date" value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} className={ui.input} />
              </div>
              <div>
                <label className={ui.label}>Until *</label>
                <input type="date" value={draft.until} onChange={e => setDraft({ ...draft, until: e.target.value })} className={ui.input} />
              </div>
              <div>
                <label className={ui.label}>Shift *</label>
                <select
                  value={draft.shift}
                  onChange={e => setDraft({ ...draft, shift: e.target.value as DutyShift })}
                  className={ui.input}
                >
                  {shiftsForRole(usersList.find(u => u.id === draft.userId)?.role || "nurse").map(s => (
                    <option key={s} value={s}>
                      {s} ({DUTY_SHIFT_HOURS[s]}, {SHIFT_TIMES[s].hours} hours)
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
            {(() => {
              if (draft.weekdays.length === 0 || !draft.from || !draft.until || draft.until < draft.from) return null;
              const dates = patternDates(draft.from, draft.until, draft.weekdays);
              const names = WEEKDAYS.filter(([n]) => draft.weekdays.includes(n)).map(([, name]) => name);
              return (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <b>{dates.length} shift{dates.length === 1 ? "" : "s"}</b>: every {names.join(", ")} from {dayLabel(draft.from)} until {dayLabel(draft.until)}
                  {dates.length > 0 && (
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      {dates.slice(0, 6).map(dayLabel).join(" • ")}
                      {dates.length > 6 ? " • …" : ""}
                    </div>
                  )}
                </div>
              );
            })()}
          </form>
        </Modal>
      )}
    </div>
  );
}
