import { DiagnosticResult, DoctorOrderCategory, OpdCaseType, OpdCaseVitals, TriageTier } from "../types";

/**
 * Templates for the most common OPD cases. The "orders" are a starting point that the
 * DOCTOR reviews, edits and signs; nothing is given to the patient until a doctor signs.
 * Doses are usual adult doses — adjust for children, pregnancy, kidney disease and allergies.
 */

export type VitalKey = "bp" | "hr" | "rr" | "temp" | "spo2" | "bloodSugar" | "weight" | "stools";

export interface TemplateOrder {
  kind: "medication" | "lab" | "nursing";
  label: string;
  /** Checked by default in the doctor's order list. */
  preselect?: boolean;
  // medication
  name?: string;
  dose?: string;
  route?: string;
  freq?: string;
  notes?: string;
  // lab / imaging request
  test?: string;
  category?: DiagnosticResult["category"];
  specimen?: string;
  // nursing / monitoring / diet / IV order
  orderCategory?: DoctorOrderCategory;
  order?: string;
}

export interface CaseTemplate {
  type: OpdCaseType;
  short: string;
  description: string;
  symptoms: string[];
  /** Symptoms that are warning signs for this case. */
  redFlagSymptoms: string[];
  /** Vital signs to emphasise for this case. */
  checks: VitalKey[];
  monitoring: string[];
  careActions: string[];
  orders: TemplateOrder[];
  homeAdvice: string;
}

export const CASE_TEMPLATES: CaseTemplate[] = [
  {
    type: "URTI / Common Cold / Flu",
    short: "URTI / Flu",
    description: "Fever, cough, colds, sore throat",
    symptoms: ["Fever", "Cough", "Colds / runny nose", "Sore throat", "Body aches", "Headache"],
    redFlagSymptoms: ["Difficulty breathing", "Fever for more than 3 days", "Chest pain"],
    checks: ["temp", "spo2", "rr", "hr"],
    monitoring: ["Temperature every 4 hours", "Oral fluid intake"],
    careActions: ["Tepid sponge bath given", "Oral fluids encouraged", "Advised mask / cough etiquette"],
    orders: [
      { kind: "medication", label: "Paracetamol 500 mg tab — every 4 hours as needed for fever", preselect: true, name: "Paracetamol", dose: "500 mg tab", route: "Oral (PO)", freq: "Every 4 hours as needed for temp ≥ 37.8°C", notes: "Max 4 g a day." },
      { kind: "medication", label: "Bioflu (Phenylephrine + Chlorphenamine + Paracetamol) — every 6 hours as needed", name: "Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol (Bioflu)", dose: "10 mg / 2 mg / 500 mg tab", route: "Oral (PO)", freq: "Every 6 hours as needed for colds, fever and body aches", notes: "May cause drowsiness. Do not take with other paracetamol products." },
      { kind: "nursing", label: "Increase oral fluids, rest; tepid sponge bath if temp ≥ 38.5°C", preselect: true, orderCategory: "Nursing Care", order: "Encourage oral fluids and rest. Tepid sponge bath if temperature ≥ 38.5°C." },
      { kind: "lab", label: "CBC (if fever > 3 days)", test: "Complete Blood Count (CBC)", category: "Hematology", specimen: "Whole blood (EDTA)" },
    ],
    homeAdvice: "Rest, drink plenty of fluids, paracetamol for fever. Return if fever lasts more than 3 days, difficulty breathing, or chest pain.",
  },
  {
    type: "Hypertension",
    short: "Hypertension",
    description: "Headache, dizziness, BP monitoring, maintenance meds",
    symptoms: ["Headache", "Dizziness", "Nape pain", "Blurred vision", "Palpitations"],
    redFlagSymptoms: ["Chest pain", "Weakness / numbness on one side", "Slurred speech", "Severe headache with vomiting"],
    checks: ["bp", "hr"],
    monitoring: ["BP every 30 minutes until below 160/100 mmHg", "BP again before release"],
    careActions: ["Patient seated and rested 5 minutes before BP", "Health teaching: low-salt diet, take maintenance meds daily"],
    orders: [
      { kind: "nursing", label: "BP every 30 minutes until < 160/100, then before release", preselect: true, orderCategory: "Monitoring", order: "Monitor BP every 30 minutes until below 160/100 mmHg, then recheck before release. Inform doctor if ≥ 180/120." },
      { kind: "medication", label: "Amlodipine 5 mg — once daily (maintenance)", name: "Amlodipine", dose: "5 mg tab", route: "Oral (PO)", freq: "Once daily", notes: "Maintenance anti-hypertensive." },
      { kind: "medication", label: "Losartan 50 mg — once daily (maintenance)", name: "Losartan Potassium", dose: "50 mg tab", route: "Oral (PO)", freq: "Once daily", notes: "Maintenance anti-hypertensive. Avoid in pregnancy." },
      { kind: "nursing", label: "Low-salt diet", orderCategory: "Diet", order: "Low-salt (2 g sodium) diet." },
      { kind: "lab", label: "Creatinine & electrolytes", test: "Creatinine, Sodium, Potassium", category: "Clinical Chemistry", specimen: "Serum" },
      { kind: "lab", label: "ECG (if chest pain or palpitations)", test: "12-lead ECG", category: "Cardiology", specimen: "ECG tracing" },
    ],
    homeAdvice: "Take maintenance medicines every day, low-salt diet, check BP regularly. Return at once for chest pain, one-sided weakness, slurred speech or severe headache.",
  },
  {
    type: "Diabetes Mellitus Type 2",
    short: "Diabetes (Type 2)",
    description: "FBS / RBS check, wound check",
    symptoms: ["Frequent urination", "Excessive thirst", "Weakness / fatigue", "Blurred vision", "Numbness of feet", "Wound that does not heal"],
    redFlagSymptoms: ["Infected wound (pus, spreading redness)", "Very drowsy or confused", "Vomiting / unable to eat"],
    checks: ["bloodSugar", "bp", "temp", "weight"],
    monitoring: ["Blood sugar (FBS if fasting, otherwise RBS)", "Wound check and dressing"],
    careActions: ["Capillary blood glucose taken", "Wound cleaned and dressed", "Foot care teaching done"],
    orders: [
      { kind: "nursing", label: "Capillary blood glucose (FBS / RBS) now and before release", preselect: true, orderCategory: "Monitoring", order: "Capillary blood glucose now and before release. Inform doctor if below 70 or above 300 mg/dL." },
      { kind: "nursing", label: "Wound cleaning and dressing", orderCategory: "Nursing Care", order: "Clean wound with NSS and apply dry sterile dressing. Document size and signs of infection." },
      { kind: "lab", label: "FBS (fasting blood sugar)", preselect: true, test: "Fasting Blood Sugar (FBS)", category: "Clinical Chemistry", specimen: "Serum (fasting 8–10 hours)" },
      { kind: "lab", label: "HbA1c", test: "HbA1c", category: "Clinical Chemistry", specimen: "Whole blood (EDTA)" },
      { kind: "medication", label: "Metformin 500 mg — twice daily with meals (maintenance)", name: "Metformin", dose: "500 mg tab", route: "Oral (PO)", freq: "Twice daily with meals", notes: "Maintenance. Check kidney function." },
      { kind: "nursing", label: "Diabetic diet", orderCategory: "Diet", order: "Diabetic diet; avoid sweets and sugary drinks." },
    ],
    homeAdvice: "Take medicines daily, diabetic diet, check blood sugar, inspect feet every day. Return for very high or very low sugar, infected wound, or drowsiness.",
  },
  {
    type: "Asthma / Bronchitis",
    short: "Asthma / Bronchitis",
    description: "Difficulty breathing, wheezing, nebulization",
    symptoms: ["Difficulty breathing", "Wheezing", "Cough", "Chest tightness", "Cough with phlegm"],
    redFlagSymptoms: ["Cannot speak in full sentences", "Bluish lips", "No improvement after nebulization"],
    checks: ["spo2", "rr", "hr", "temp"],
    monitoring: ["SpO2, RR and wheezing before and 20 minutes after each nebulization"],
    careActions: ["Nebulization given (Salbutamol)", "Positioned upright / high-back rest", "Inhaler technique taught"],
    orders: [
      { kind: "medication", label: "Salbutamol 2.5 mg nebule — now; may repeat every 20 min (up to 3 doses)", preselect: true, name: "Salbutamol (nebule)", dose: "2.5 mg / 2.5 mL", route: "Nebulization", freq: "Now; may repeat every 20 minutes up to 3 doses", notes: "Reassess SpO2/RR after each dose." },
      { kind: "nursing", label: "SpO2, RR, wheeze before and 20 min after each nebulization", preselect: true, orderCategory: "Monitoring", order: "Check SpO2, RR and wheezing before and 20 minutes after each nebulization. Inform doctor if SpO2 < 92%." },
      { kind: "medication", label: "Salbutamol inhaler 100 mcg — 2 puffs as needed", name: "Salbutamol (inhaler)", dose: "100 mcg/puff, 2 puffs", route: "Inhalation", freq: "Every 4–6 hours as needed for wheezing" },
      { kind: "lab", label: "Chest X-ray PA (if fever or no improvement)", test: "Chest X-ray PA", category: "Radiology", specimen: "Imaging study" },
    ],
    homeAdvice: "Use the inhaler as taught, avoid smoke and dust. Return at once for difficulty breathing, bluish lips, or no relief from the inhaler.",
  },
  {
    type: "Urinary Tract Infection (UTI)",
    short: "UTI",
    description: "Painful urination, frequency",
    symptoms: ["Painful urination (dysuria)", "Frequent urination", "Urgency", "Lower abdominal pain", "Cloudy / foul-smelling urine"],
    redFlagSymptoms: ["Fever with flank (back) pain", "Vomiting", "Pregnant"],
    checks: ["temp", "bp", "hr"],
    monitoring: ["Temperature", "Pain score"],
    careActions: ["Clean-catch urine specimen collected", "Advised to increase water intake"],
    orders: [
      { kind: "lab", label: "Urinalysis", preselect: true, test: "Urinalysis", category: "Clinical Chemistry", specimen: "Urine (midstream clean-catch)" },
      { kind: "lab", label: "Urine culture & sensitivity", test: "Urine Culture & Sensitivity", category: "Microbiology", specimen: "Urine (midstream clean-catch)" },
      { kind: "medication", label: "Nitrofurantoin 100 mg — twice daily for 5 days", name: "Nitrofurantoin", dose: "100 mg cap", route: "Oral (PO)", freq: "Twice daily for 5 days", notes: "Take with food." },
      { kind: "medication", label: "Cefuroxime 500 mg — twice daily for 7 days", name: "Cefuroxime", dose: "500 mg tab", route: "Oral (PO)", freq: "Twice daily for 7 days" },
      { kind: "nursing", label: "Increase oral fluids", preselect: true, orderCategory: "Nursing Care", order: "Encourage 8–10 glasses of water a day; void frequently." },
    ],
    homeAdvice: "Finish the antibiotics, drink plenty of water, do not hold urine. Return for fever with back pain, vomiting, or blood in urine.",
  },
  {
    type: "Acute Gastroenteritis (AGE)",
    short: "AGE",
    description: "Diarrhea, vomiting, dehydration",
    symptoms: ["Diarrhea (loose stools)", "Vomiting", "Abdominal cramps", "Fever", "Dry lips / thirsty", "Decreased urine"],
    redFlagSymptoms: ["Bloody stools", "Unable to drink / keeps vomiting", "Very drowsy / weak", "Sunken eyes, no urine for 6 hours"],
    checks: ["hr", "bp", "temp", "stools", "weight"],
    monitoring: ["Number of stools and vomiting", "Intake and output", "Signs of dehydration every 2 hours"],
    careActions: ["ORS given", "Intake and output recorded", "Hand hygiene teaching done"],
    orders: [
      { kind: "medication", label: "Oral Rehydration Salts (ORS) — after every loose stool", preselect: true, name: "Oral Rehydration Salts (ORS)", dose: "1 sachet in 200 mL water", route: "Oral (PO)", freq: "After every loose stool / vomiting episode", notes: "Sip slowly; continue feeding." },
      { kind: "nursing", label: "Monitor stools, vomiting, intake & output; dehydration signs every 2 hours", preselect: true, orderCategory: "Monitoring", order: "Record number of stools/vomiting, intake and output. Check for dehydration every 2 hours; inform doctor if HR > 120 or SBP < 90." },
      { kind: "lab", label: "Fecalysis", test: "Fecalysis", category: "Microbiology", specimen: "Stool" },
      { kind: "lab", label: "Serum electrolytes (if dehydrated)", test: "Sodium, Potassium", category: "Clinical Chemistry", specimen: "Serum" },
      { kind: "nursing", label: "IV fluids: Lactated Ringer's 1 L (if unable to drink)", orderCategory: "IV Fluids", order: "Lactated Ringer's 1 L to run for 8 hours if unable to tolerate oral fluids." },
      { kind: "medication", label: "Zinc sulfate 20 mg — once daily for 10–14 days (children)", name: "Zinc Sulfate", dose: "20 mg", route: "Oral (PO)", freq: "Once daily for 10–14 days", notes: "For children with diarrhea." },
    ],
    homeAdvice: "Continue ORS after each loose stool, eat small frequent meals, wash hands. Return for bloody stools, cannot drink, very weak, or no urine for 6 hours.",
  },
  {
    type: "Other Minor Case",
    short: "Other",
    description: "Any other minor complaint",
    symptoms: [],
    redFlagSymptoms: [],
    checks: ["bp", "hr", "temp", "spo2"],
    monitoring: [],
    careActions: [],
    orders: [],
    homeAdvice: "",
  },
];

export const templateFor = (type: OpdCaseType) => CASE_TEMPLATES.find(t => t.type === type) || CASE_TEMPLATES[CASE_TEMPLATES.length - 1];

const num = (v?: string) => {
  const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

/** Warning signs from the vital signs and the symptoms ticked. */
export function evaluateRedFlags(type: OpdCaseType, symptoms: string[], v: Partial<OpdCaseVitals>): string[] {
  const flags: string[] = [];
  const t = templateFor(type);
  symptoms.filter(s => t.redFlagSymptoms.includes(s)).forEach(s => flags.push(s));
  const [sys, dia] = String(v.bp || "").split("/").map(x => num(x));
  if (sys !== undefined && dia !== undefined && (sys >= 180 || dia >= 120)) flags.push(`BP ${v.bp} — 180/120 or higher`);
  if (sys !== undefined && sys < 90) flags.push(`Low BP (${v.bp})`);
  const spo2 = num(v.spo2);
  if (spo2 !== undefined && spo2 < 92) flags.push(`SpO2 ${spo2}% — below 92%`);
  const temp = num(v.temp);
  if (temp !== undefined && temp >= 39.5) flags.push(`Very high fever (${temp}°C)`);
  const hr = num(v.hr);
  if (hr !== undefined && (hr > 120 || hr < 50)) flags.push(`Heart rate ${hr}/min`);
  const rr = num(v.rr);
  if (rr !== undefined && rr > 30) flags.push(`Fast breathing (RR ${rr}/min)`);
  const sugar = num(v.bloodSugar);
  if (sugar !== undefined && sugar >= 300) flags.push(`Blood sugar ${sugar} mg/dL — 300 or higher`);
  if (sugar !== undefined && sugar < 70) flags.push(`Low blood sugar (${sugar} mg/dL)`);
  return flags;
}

/** Suggested condition from the warning signs: none → stable, some → observation, dangerous → critical. */
export function suggestedTriage(flags: string[]): TriageTier {
  if (flags.length === 0) return "stable";
  const severe = flags.some(f => /SpO2 [0-8]\d%|Low BP|Bluish|one side|Slurred|Cannot speak|Very drowsy|confused/i.test(f));
  return severe ? "critical" : "observation";
}

export const VITAL_LABELS: Record<VitalKey, { label: string; placeholder: string }> = {
  bp: { label: "BP (mmHg)", placeholder: "120/80" },
  hr: { label: "Heart rate (/min)", placeholder: "80" },
  rr: { label: "Resp. rate (/min)", placeholder: "18" },
  temp: { label: "Temp (°C)", placeholder: "36.8" },
  spo2: { label: "SpO2 (%)", placeholder: "98" },
  bloodSugar: { label: "Blood sugar (mg/dL)", placeholder: "110" },
  weight: { label: "Weight (kg)", placeholder: "60" },
  stools: { label: "Stools / vomiting since last check", placeholder: "e.g. 3 stools, 1 vomit" },
};
