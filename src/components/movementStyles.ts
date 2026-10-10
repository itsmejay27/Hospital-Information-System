import { MovementType, TriageTier } from "../types";

/** Badge colours per movement type (Transfer & Discharge History and the patient history panel). */
export const movementStyle: Record<MovementType, string> = {
  "Moved to OPD Ward": "bg-teal-50 text-teal-700 border-teal-200",
  Admitted: "bg-sky-50 text-sky-700 border-sky-200",
  "Ward / Bed Transfer": "bg-violet-50 text-violet-700 border-violet-200",
  "Referred / Transferred Out": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Discharged: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Sent Home (OPD)": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Condition Updated": "bg-amber-50 text-amber-800 border-amber-200",
};

/** Same-size badge so every movement lines up in the table. */
export const movementBadge = "inline-flex items-center justify-center w-40 px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap";

export const tierStyle: Record<TriageTier, string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  observation: "bg-amber-50 text-amber-800 border-amber-200",
  stable: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export const tierText = (t?: TriageTier) => (t ? t[0].toUpperCase() + t.slice(1) : "");
