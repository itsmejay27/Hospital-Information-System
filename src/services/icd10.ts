/**
 * Common outpatient (OPD) diagnoses in Philippine practice with their WHO ICD-10 codes,
 * grouped by body system for the consultation form. Doctors can still type any other code.
 */
export interface Icd10Entry {
  code: string;
  name: string;
  group: string;
}

const g = (group: string, items: [string, string][]): Icd10Entry[] => items.map(([code, name]) => ({ code, name, group }));

export const ICD10_COMMON: Icd10Entry[] = [
  ...g("Respiratory", [
    ["J06.9", "Acute upper respiratory infection, unspecified (URTI)"],
    ["J00", "Acute nasopharyngitis (common cold)"],
    ["J02.9", "Acute pharyngitis, unspecified"],
    ["J03.9", "Acute tonsillitis, unspecified"],
    ["J01.9", "Acute sinusitis, unspecified"],
    ["J20.9", "Acute bronchitis, unspecified"],
    ["J18.9", "Pneumonia, unspecified (community-acquired)"],
    ["J45.9", "Asthma, unspecified"],
    ["J44.9", "Chronic obstructive pulmonary disease, unspecified"],
    ["J30.4", "Allergic rhinitis, unspecified"],
    ["J11.1", "Influenza with other respiratory manifestations (flu)"],
    ["A16.2", "Pulmonary tuberculosis, without bacteriological confirmation"],
    ["U07.1", "COVID-19, virus identified"],
  ]),
  ...g("Cardiovascular", [
    ["I10", "Essential (primary) hypertension"],
    ["I11.9", "Hypertensive heart disease without heart failure"],
    ["I20.9", "Angina pectoris, unspecified"],
    ["I25.1", "Atherosclerotic heart disease"],
    ["I50.9", "Heart failure, unspecified"],
    ["I48", "Atrial fibrillation and flutter"],
    ["I63.9", "Cerebral infarction (stroke), unspecified"],
  ]),
  ...g("Endocrine & metabolic", [
    ["E11.9", "Type 2 diabetes mellitus without complications"],
    ["E11.6", "Type 2 diabetes mellitus with other specified complications"],
    ["E78.5", "Hyperlipidaemia (dyslipidaemia), unspecified"],
    ["E78.0", "Pure hypercholesterolaemia"],
    ["E05.9", "Thyrotoxicosis (hyperthyroidism), unspecified"],
    ["E03.9", "Hypothyroidism, unspecified"],
    ["E66.9", "Obesity, unspecified"],
    ["E86", "Volume depletion (dehydration)"],
  ]),
  ...g("Digestive", [
    ["A09", "Diarrhoea and gastroenteritis of presumed infectious origin (AGE)"],
    ["K29.7", "Gastritis, unspecified"],
    ["K21.9", "Gastro-oesophageal reflux disease without oesophagitis (GERD)"],
    ["K30", "Dyspepsia"],
    ["K59.0", "Constipation"],
    ["K35.8", "Acute appendicitis, other and unspecified"],
    ["K80.2", "Gallstones without cholecystitis"],
    ["B82.9", "Intestinal parasitism, unspecified"],
    ["A01.0", "Typhoid fever"],
  ]),
  ...g("Infectious & tropical", [
    ["A90", "Dengue fever"],
    ["A91", "Dengue haemorrhagic fever"],
    ["A27.9", "Leptospirosis, unspecified"],
    ["B01.9", "Varicella (chickenpox) without complication"],
    ["B05.9", "Measles without complication"],
    ["Z20.3", "Contact with and exposure to rabies (animal bite)"],
  ]),
  ...g("Urinary & reproductive", [
    ["N39.0", "Urinary tract infection, site not specified (UTI)"],
    ["N20.0", "Calculus of kidney (kidney stone)"],
    ["N40", "Hyperplasia of prostate (BPH)"],
    ["N76.0", "Acute vaginitis"],
    ["Z34.9", "Supervision of normal pregnancy, unspecified (prenatal check-up)"],
  ]),
  ...g("Skin", [
    ["L30.9", "Dermatitis, unspecified"],
    ["L50.9", "Urticaria, unspecified"],
    ["L03.9", "Cellulitis, unspecified"],
    ["L02.9", "Cutaneous abscess (boil), unspecified"],
    ["B35.4", "Tinea corporis (ringworm)"],
    ["B86", "Scabies"],
    ["L70.0", "Acne vulgaris"],
  ]),
  ...g("Eye & ENT", [
    ["H10.9", "Conjunctivitis, unspecified (sore eyes)"],
    ["H66.9", "Otitis media, unspecified"],
    ["H60.9", "Otitis externa, unspecified"],
  ]),
  ...g("Musculoskeletal & injury", [
    ["M54.5", "Low back pain"],
    ["M79.1", "Myalgia"],
    ["M19.9", "Osteoarthritis (arthrosis), unspecified"],
    ["M10.9", "Gout, unspecified"],
    ["S93.4", "Sprain of ankle"],
    ["T14.1", "Open wound of unspecified body region"],
    ["T30.0", "Burn of unspecified body region"],
    ["S29.9", "Injury of thorax, unspecified"],
  ]),
  ...g("Nervous system & mental health", [
    ["R51", "Headache"],
    ["G43.9", "Migraine, unspecified"],
    ["R42", "Dizziness and giddiness (vertigo)"],
    ["G40.9", "Epilepsy, unspecified"],
    ["G51.0", "Bell's palsy"],
    ["F41.1", "Generalized anxiety disorder"],
    ["F32.9", "Depressive episode, unspecified"],
  ]),
  ...g("Signs, symptoms & check-ups", [
    ["R50.9", "Fever, unspecified"],
    ["R05", "Cough"],
    ["R10.4", "Abdominal pain, other and unspecified"],
    ["R07.4", "Chest pain, unspecified"],
    ["D64.9", "Anaemia, unspecified"],
    ["Z00.0", "General medical examination (annual physical / medical certificate)"],
    ["Z76.0", "Issue of repeat prescription"],
  ]),
];

export const ICD10_GROUPS = [...new Set(ICD10_COMMON.map(e => e.group))];

export const findIcd10 = (code: string) => ICD10_COMMON.find(e => e.code === code);
