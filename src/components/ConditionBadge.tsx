import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { TriageTier } from "../types";
import Modal from "./Modal";
import * as ui from "./tableStyles";

const style: Record<TriageTier, string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  observation: "bg-amber-50 text-amber-800 border-amber-200",
  stable: "bg-emerald-50 text-emerald-800 border-emerald-200",
};
const dot: Record<TriageTier, string> = { critical: "bg-rose-500", observation: "bg-amber-500", stable: "bg-emerald-500" };
const LABEL: Record<TriageTier, string> = { critical: "Critical", observation: "Observation", stable: "Stable" };

/**
 * Patient condition (triage) badge. Doctors can click it to change the condition with a reason;
 * the change updates the queue, ward and front desk at once and is kept in the patient's history.
 */
export default function ConditionBadge({ patientId, fallback }: { patientId: string; fallback?: TriageTier }) {
  const { user } = useAuth();
  const { patients, updatePatientCondition } = useOpdData();
  const patient = patients.find(p => p.id === patientId);
  const tier: TriageTier = patient?.triageTier || fallback || "stable";
  const canEdit = user?.role === "doctor" && !!patient && patient.admissionStatus !== "Discharged";
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState<TriageTier>(tier);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const badge = (
    <span
      title={patient?.triageReason || undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${style[tier]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot[tier]} ${tier === "critical" ? "animate-pulse" : ""}`} />
      {LABEL[tier]}
      {canEdit && <span className="normal-case font-semibold opacity-70">▾</span>}
    </span>
  );

  if (!canEdit) return badge;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (next === tier) return setError("Choose a different condition.");
    if (!reason.trim()) return setError("Enter the reason (e.g. vital signs now normal after treatment).");
    updatePatientCondition(patientId, next, reason.trim());
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setNext(tier === "stable" ? "observation" : "stable");
          setReason("");
          setError(null);
          setOpen(true);
        }}
        className="cursor-pointer"
        aria-label={`Condition ${LABEL[tier]} — click to update`}
      >
        {badge}
      </button>
      {open && (
        <Modal
          title={`Update Condition — ${patient!.name}`}
          subtitle={`Currently ${LABEL[tier]}. Doctors, nurses and the front desk will see the new status right away.`}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setOpen(false)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="condition-form" className={ui.primaryBtn}>
                Save Condition
              </button>
            </>
          }
        >
          <form id="condition-form" onSubmit={save} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div className="grid grid-cols-3 gap-2">
              {(["stable", "observation", "critical"] as TriageTier[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNext(t)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${next === t ? `${style[t]} ring-2 ring-offset-1 ring-emerald-400` : "bg-white text-slate-600 border-slate-200"}`}
                >
                  {LABEL[t]}
                </button>
              ))}
            </div>
            <div>
              <label className={ui.label}>Reason *</label>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={next === "stable" ? "e.g. BP 120/80, SpO2 98% after treatment; responsive and comfortable" : "e.g. SpO2 dropped to 90%"}
                className={ui.input}
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
