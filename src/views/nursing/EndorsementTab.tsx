import React, { useState } from "react";
import { ShiftEndorsement, DUTY_SHIFT_HOURS, DutyShift } from "../../types";
import { useOpdData } from "../../context/OpdDataContext";
import Modal from "../../components/Modal";
import { Plus, Search } from "../../components/Icons";
import * as ui from "../../components/tableStyles";
import { NursingTabProps, currentShift, newId, nowStamp } from "./helpers";

const NEXT_SHIFT: Record<DutyShift, DutyShift> = { Morning: "Afternoon", Afternoon: "Night", Night: "Morning" };
const shiftText = (s: DutyShift) => `${s} (${DUTY_SHIFT_HOURS[s]})`;

const SBAR: { name: "situation" | "background" | "assessment" | "recommendation"; letter: string; label: string; hint: string }[] = [
  { name: "situation", letter: "S", label: "Situation", hint: "Current ward status / what is happening now" },
  { name: "background", letter: "B", label: "Background", hint: "Relevant history, events during your shift, meds given" },
  { name: "assessment", letter: "A", label: "Assessment", hint: "Your assessment of the patients' condition" },
  { name: "recommendation", letter: "R", label: "Recommendation", hint: "What the incoming nurse needs to do / watch for" },
];

export default function EndorsementTab({ user }: NursingTabProps) {
  const { shiftEndorsements, addShiftEndorsement, usersList } = useOpdData();
  const canWrite = user.role === "nurse";
  const nurses = usersList.filter(u => u.role === "nurse" && u.id !== user.id && u.status !== "suspended");

  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<ShiftEndorsement | null>(null);
  const [draft, setDraft] = useState<{
    ward: string;
    fromShift: DutyShift;
    incomingNurse: string;
    patientCensus: string;
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
    urgentTasks: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = shiftEndorsements.filter(e => {
    const q = search.toLowerCase();
    return !q || [e.ward, e.outgoingNurse, e.incomingNurse, e.shiftPeriod].some(v => v.toLowerCase().includes(q));
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.ward.trim() || !draft.incomingNurse.trim()) return setError("Ward and incoming nurse are required.");
    if (!draft.situation.trim() || !draft.recommendation.trim()) return setError("Situation and Recommendation are required.");
    const incoming = nurses.find(n => n.name === draft.incomingNurse);
    addShiftEndorsement({
      id: newId("END"),
      timestamp: nowStamp(),
      shiftPeriod: `${shiftText(draft.fromShift)} to ${shiftText(NEXT_SHIFT[draft.fromShift])}`,
      ward: draft.ward.trim(),
      outgoingNurse: user.name,
      outgoingNurseLicense: user.licenseNumber || "",
      incomingNurse: draft.incomingNurse.trim(),
      incomingNurseLicense: incoming?.licenseNumber || "",
      patientCensus: Number(draft.patientCensus) || 0,
      situation: draft.situation.trim(),
      background: draft.background.trim(),
      assessment: draft.assessment.trim(),
      recommendation: draft.recommendation.trim(),
      urgentTasks: draft.urgentTasks
        .split("\n")
        .map(t => t.trim())
        .filter(Boolean),
    });
    setDraft(null);
  };

  return (
    <div className={ui.tableWrap}>
      <div className={ui.toolbar}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ward, nurse, shift..."
            className={`${ui.input} pl-8`}
          />
        </div>
        {canWrite && (
          <button
            onClick={() => {
              setError(null);
              setDraft({
                ward: "",
                fromShift: currentShift(),
                incomingNurse: "",
                patientCensus: "",
                situation: "",
                background: "",
                assessment: "",
                recommendation: "",
                urgentTasks: "",
              });
            }}
            className={ui.primaryBtn}
          >
            <Plus size={14} /> New Endorsement
          </button>
        )}
      </div>

      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead className={ui.thead}>
            <tr>
              <th className={ui.th}>Date / Time</th>
              <th className={ui.th}>Shift Handover</th>
              <th className={ui.th}>Ward / Area</th>
              <th className={ui.th}>Endorsed By</th>
              <th className={ui.th}>Received By</th>
              <th className={ui.th}>Census</th>
              <th className={ui.th}>Urgent Tasks</th>
              <th className={ui.th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={ui.emptyCell}>
                  No shift endorsements yet.
                </td>
              </tr>
            )}
            {rows.map(e => (
              <tr key={e.id} className={ui.tr}>
                <td className={`${ui.td} font-mono whitespace-nowrap`}>{e.timestamp}</td>
                <td className={`${ui.td} max-w-[220px]`}>{e.shiftPeriod}</td>
                <td className={ui.td}>{e.ward}</td>
                <td className={`${ui.td} whitespace-nowrap`}>
                  {e.outgoingNurse}
                  {e.outgoingNurseLicense && <div className="text-[10px] text-slate-400">{e.outgoingNurseLicense}</div>}
                </td>
                <td className={`${ui.td} whitespace-nowrap`}>
                  {e.incomingNurse}
                  {e.incomingNurseLicense && <div className="text-[10px] text-slate-400">{e.incomingNurseLicense}</div>}
                </td>
                <td className={`${ui.td} text-center font-bold`}>{e.patientCensus}</td>
                <td className={ui.td}>
                  {e.urgentTasks.length > 0 ? (
                    <span className={`${ui.badge} bg-amber-50 text-amber-700 border-amber-200`}>{e.urgentTasks.length} tasks</span>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </td>
                <td className={`${ui.td} text-right`}>
                  <button onClick={() => setViewing(e)} className="text-emerald-700 font-bold hover:underline cursor-pointer">
                    View SBAR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <Modal
          wide
          title={`Shift Endorsement — ${viewing.ward}`}
          subtitle={`${viewing.timestamp} • ${viewing.shiftPeriod}`}
          onClose={() => setViewing(null)}
        >
          <table className={`${ui.table} border border-slate-200`}>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 w-40 bg-slate-50 font-bold">Endorsed by</td>
                <td className="px-3 py-2">
                  {viewing.outgoingNurse} {viewing.outgoingNurseLicense}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 bg-slate-50 font-bold">Received by</td>
                <td className="px-3 py-2">
                  {viewing.incomingNurse} {viewing.incomingNurseLicense}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 bg-slate-50 font-bold">Patient census</td>
                <td className="px-3 py-2">{viewing.patientCensus}</td>
              </tr>
              {SBAR.map(f => (
                <tr key={f.name} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-2 bg-emerald-50 text-emerald-800 font-bold">
                    {f.letter} — {f.label}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-line">{viewing[f.name] || "—"}</td>
                </tr>
              ))}
              <tr className="align-top">
                <td className="px-3 py-2 bg-amber-50 text-amber-800 font-bold">Urgent tasks</td>
                <td className="px-3 py-2">
                  {viewing.urgentTasks.length ? (
                    <ol className="list-decimal pl-4 space-y-0.5">
                      {viewing.urgentTasks.map(t => (
                        <li key={t}>{t}</li>
                      ))}
                    </ol>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </Modal>
      )}

      {draft && (
        <Modal
          wide
          title="New Shift Endorsement (SBAR)"
          subtitle={`Endorsed by ${user.name} at ${nowStamp()}`}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" onClick={() => setDraft(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="endorsement-form" className={ui.primaryBtn}>
                Submit Endorsement
              </button>
            </>
          }
        >
          <form id="endorsement-form" onSubmit={submit} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>Ward / Area *</label>
                <input
                  value={draft.ward}
                  onChange={e => setDraft({ ...draft, ward: e.target.value })}
                  placeholder="e.g. Medical Ward 3"
                  className={ui.input}
                />
              </div>
              <div>
                <label className={ui.label}>Handover</label>
                <select
                  value={draft.fromShift}
                  onChange={e => setDraft({ ...draft, fromShift: e.target.value as DutyShift })}
                  className={ui.input}
                >
                  {(["Morning", "Afternoon", "Night"] as DutyShift[]).map(s => (
                    <option key={s} value={s}>
                      {s} → {NEXT_SHIFT[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>Incoming Nurse *</label>
                <input
                  list="incoming-nurses"
                  value={draft.incomingNurse}
                  onChange={e => setDraft({ ...draft, incomingNurse: e.target.value })}
                  placeholder="Name of the nurse receiving the endorsement"
                  className={ui.input}
                />
                <datalist id="incoming-nurses">
                  {nurses.map(n => (
                    <option key={n.id} value={n.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={ui.label}>Patient Census</label>
                <input
                  type="number"
                  min={0}
                  value={draft.patientCensus}
                  onChange={e => setDraft({ ...draft, patientCensus: e.target.value })}
                  className={ui.input}
                />
              </div>
            </div>
            {SBAR.map(f => (
              <div key={f.name}>
                <label className={ui.label}>
                  {f.letter} — {f.label}
                  {(f.name === "situation" || f.name === "recommendation") && " *"}
                </label>
                <textarea
                  rows={2}
                  value={draft[f.name]}
                  onChange={e => setDraft({ ...draft, [f.name]: e.target.value })}
                  placeholder={f.hint}
                  className={ui.input}
                />
              </div>
            ))}
            <div>
              <label className={ui.label}>Urgent Tasks (one per line)</label>
              <textarea
                rows={3}
                value={draft.urgentTasks}
                onChange={e => setDraft({ ...draft, urgentTasks: e.target.value })}
                placeholder={"Follow up CBC result for Bed 204-A\nIV fluid due for replacement at 16:00"}
                className={ui.input}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
