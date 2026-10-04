import { MedicationOrder, StockItem } from "../types";

/** Done when fully dispensed (older records only have dispensedAt). */
export const isFullyDispensed = (m: MedicationOrder) => m.fullyDispensed ?? !!m.dispensedAt;
export const isToDispense = (m: MedicationOrder) => m.status === "Active" && !isFullyDispensed(m);
export const dispensedTotal = (m: MedicationOrder) => (m.dispenses || []).reduce((s, d) => s + d.quantity, 0);

export const today = () => new Date().toISOString().slice(0, 10);
export const daysUntil = (date?: string) => (date ? Math.floor((new Date(date).getTime() - new Date(today()).getTime()) / 86400000) : Infinity);

export function stockStatus(s: StockItem): { label: string; style: string } | null {
  const d = daysUntil(s.expiryDate);
  if (d < 0) return { label: "Expired", style: "bg-rose-50 text-rose-700 border-rose-200" };
  if (s.quantity <= 0) return { label: "Out of stock", style: "bg-rose-50 text-rose-700 border-rose-200" };
  if (s.quantity <= s.reorderLevel) return { label: "Low stock", style: "bg-amber-50 text-amber-700 border-amber-200" };
  if (d <= 90) return { label: `Expires in ${d} d`, style: "bg-amber-50 text-amber-700 border-amber-200" };
  return null;
}


// Allergy classes: an allergy to the class name also covers these medicines.
const ALLERGY_CLASSES: Record<string, string[]> = {
  penicillin: ["penicillin", "amoxicillin", "ampicillin", "co-amoxiclav", "amoxiclav", "augmentin", "cloxacillin", "oxacillin", "piperacillin", "nafcillin", "dicloxacillin"],
  cephalosporin: ["cef", "cephalexin", "cephradine"],
  sulfa: ["sulfa", "sulfamethoxazole", "cotrimoxazole", "co-trimoxazole", "sulfasalazine"],
  nsaid: ["ibuprofen", "mefenamic", "naproxen", "diclofenac", "ketorolac", "celecoxib", "aspirin", "indomethacin", "meloxicam", "etoricoxib"],
  aspirin: ["aspirin", "acetylsalicylic"],
  macrolide: ["azithromycin", "clarithromycin", "erythromycin"],
  quinolone: ["ciprofloxacin", "levofloxacin", "ofloxacin", "moxifloxacin"],
  opioid: ["morphine", "tramadol", "codeine", "oxycodone", "fentanyl", "nalbuphine"],
  tetracycline: ["tetracycline", "doxycycline", "minocycline"],
};

/** Returns the recorded allergy that may apply to this medicine (by name or drug class), if any. */
export function allergyMatch(medicine: string, allergies: string[]): string | undefined {
  const med = medicine.toLowerCase();
  const medWords = med.split(/[^a-z-]+/).filter(w => w.length > 3);
  return allergies.find(a => {
    const al = a.toLowerCase();
    if (medWords.some(w => al.includes(w))) return true;
    if (al.split(/[^a-z-]+/).some(w => w.length > 3 && med.includes(w))) return true;
    return Object.entries(ALLERGY_CLASSES).some(
      ([cls, members]) => (al.includes(cls) || (cls === "nsaid" && al.includes("nsaid"))) && members.some(m => med.includes(m))
    );
  });
}
