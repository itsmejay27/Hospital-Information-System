export type Role =
  | "doctor"
  | "nurse"
  | "staff" // Front Desk Receptionist
  | "admin"
  | "medtech" // Medical Technologist (RMT)
  | "radtech" // Radiologic Technologist (RRT)
  | "radiologist" // Radiologist (physician who reads imaging studies)
  | "pharmacy" // Pharmacy Technician
  | "finance" // Chief Financial Officer
  | "legal"; // Legal Counsel

export const ALL_ROLES: Role[] = ["doctor", "nurse", "medtech", "radtech", "radiologist", "pharmacy", "staff", "finance", "legal", "admin"];

export const ROLE_LABELS: Record<Role, string> = {
  doctor: "Doctor",
  nurse: "Registered Nurse",
  medtech: "Medical Technologist (RMT)",
  radtech: "Radiologic Technologist (RRT)",
  radiologist: "Radiologist",
  pharmacy: "Pharmacy Technician",
  staff: "Front Desk Receptionist",
  finance: "Chief Financial Officer",
  legal: "Legal Counsel",
  admin: "Administrator",
};

/** Default job title and department suggested when an account is created. */
export const ROLE_DEFAULTS: Record<Role, { title: string; department: string }> = {
  doctor: { title: "Attending Physician", department: "Outpatient Department" },
  nurse: { title: "Registered Nurse", department: "Nursing Service" },
  medtech: { title: "Medical Technologist", department: "Clinical Laboratory" },
  radtech: { title: "Radiologic Technologist", department: "Radiology & Imaging" },
  radiologist: { title: "Radiologist", department: "Radiology & Imaging" },
  pharmacy: { title: "Pharmacy Technician", department: "Pharmacy" },
  staff: { title: "Front Desk Receptionist", department: "Front Desk & Admissions" },
  finance: { title: "Chief Financial Officer", department: "Finance & Billing" },
  legal: { title: "Legal Counsel", department: "Legal & Data Privacy" },
  admin: { title: "System Administrator", department: "Administration" },
};

/** Roles that must have a professional license number (PRC), unique across active staff. */
export const LICENSED_ROLES: Role[] = ["doctor", "nurse", "medtech", "radtech", "radiologist", "pharmacy"];

/** Digits of a license number, used to detect duplicates ("PRC Lic. #0096211" -> "0096211"). */
export function normalizeLicense(value?: string | null): string {
  return (value || "").replace(/\D/g, "");
}

export type Page =
  | "home"
  | "about"
  | "departments"
  | "announcements"
  | "staff"
  | "contact"
  | "dashboard"
  | "records"
  | "lab"
  | "medications"
  | "registration-admission"
  | "privacy";

export type OpdTab =
  | "dashboard"
  | "queue"
  | "registration"
  | "workbench"
  | "vitals"
  | "prescriptions"
  | "diagnostics"
  | "philhealth"
  | "referrals"
  | "reports"
  | "admin";

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  department: string;
  avatarInitials: string;
  licenseNumber?: string; // e.g. PRC Lic. #0084721
  credentials?: string;   // e.g. MD, FPCP, FPCC | RN, MAN, CCRN
  status?: "active" | "suspended" | "inactive";
  username?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Shown on the public website's staff directory (set by the administrator). */
  showInDirectory?: boolean;
}

/** Profile fields a staff member may ask to change; an administrator approves them. */
export type EditableProfileField = "name" | "title" | "department" | "licenseNumber" | "credentials" | "contactPhone" | "contactEmail";

export const PROFILE_FIELD_LABELS: Record<EditableProfileField, string> = {
  name: "Full Name",
  title: "Job Title",
  department: "Department",
  licenseNumber: "License Number",
  credentials: "Credentials",
  contactPhone: "Contact Phone",
  contactEmail: "Contact Email",
};

export interface ProfileChangeRequest {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  requestedAt: string;
  changes: Partial<Record<EditableProfileField, string>>;
  previous: Partial<Record<EditableProfileField, string>>;
  reason?: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

/** Public-facing staff card (no private details); readable without signing in. */
export interface PublicDirectoryEntry {
  id: string;
  name: string;
  title: string;
  role: Role;
  department: string;
  credentials?: string;
  photo?: string;
}

export type TriageTier = "stable" | "observation" | "critical";

export type PhilHealthCategory =
  | "Direct Contributor - Private"
  | "Direct Contributor - Government"
  | "Direct Contributor - Self-Employed"
  | "Indirect Contributor - Indigent"
  | "Senior Citizen (RA 10645)"
  | "PWD (RA 11228)"
  | "Lifetime Member";

export interface PhilHealthInfo {
  pin: string; // PhilHealth Identification Number (e.g., 12-345678901-2)
  category: PhilHealthCategory;
  eligibilityStatus: "Active / Eligible" | "Under Verification" | "Sponsored (Indigent)";
  coverageDetails: string;
}

export type ClaimStatus =
  | "Ready for Submission"
  | "Transmitted"
  | "Under Adjudication"
  | "Approved / Reimbursed"
  | "Returned / Pending Docs";

export interface PhilHealthClaim {
  id: string;
  patientId: string;
  pin: string;
  memberName: string;
  membershipType: string;
  diagnosisWithIcd: string;
  caseRateAmount: string; // e.g. "Php 6,000 - Medical Case"
  claimStatus: ClaimStatus;
  submissionDate?: string;
  hospitalCharges: number;
  philhealthBenefit: number;
  patientPayable: number;
}

export interface PatientConsents {
  treatmentCareConsent: boolean;
  healthInfoSharingConsent: boolean;
  contactNoticeConsent: boolean;
  signedDate: string;
  witnessStaff: string;
}

export interface MedicalHistory {
  pastMedical: string[];
  pastSurgical: string[];
  familyHistory: string[];
  chronicConditions: string[];
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: "Female" | "Male" | "Other";
  civilStatus: string;
  contact: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bloodType: string;
  allergies: string[];
  chiefComplaint: string;
  triageTier: TriageTier;
  triageReason?: string;
  admissionStatus: "Outpatient" | "Admitted" | "Observation" | "Discharged";
  ward?: string;
  bed?: string;
  attendingPhysician?: string;
  admissionDate?: string;
  registeredAt: string;
  philhealth?: PhilHealthInfo;
  consents?: PatientConsents;
  medicalHistory?: MedicalHistory;
}

export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese";

export interface VitalsData {
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  respiratoryRate: number;
  spo2: number;
  temperature: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  bmiCategory?: BmiCategory;
  fluidIntakeMl?: number; // IV + Oral fluid intake
  urineOutputMl?: number;  // Urine output
  fluidNotes?: string;
  recordedAt: string;
  recordedBy?: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  type: "OPD Visit" | "Inpatient Progress" | "Emergency Consultation" | "Specialist Follow-up";
  doctor: string;
  doctorLicense?: string;
  diagnosis: string;
  icd10Code?: string;
  differentialDiagnosis?: string[];
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  notes: string;
  internalClinicianNotes?: string;
  vitals: {
    bp: string;
    hr: string;
    temp: string;
    wt: string;
    spo2?: string;
    rr?: string;
    height?: string;
    bmi?: string;
    bmiCategory?: string;
    systolic?: number;
    diastolic?: number;
    fluidIntakeMl?: number;
    urineOutputMl?: number;
  };
}

export interface LabTestItem {
  name: string;
  value: string;
  ref: string;
  /** H/L = outside the reference range; HH/LL = critical (doctor is alerted immediately). */
  flag: "H" | "L" | "HH" | "LL" | null;
  unit?: string;
}

export interface DiagnosticResult {
  id: string;
  patientId: string;
  patientName: string;
  test: string;
  category: "Hematology" | "Clinical Chemistry" | "Radiology" | "Microbiology" | "Cardiology";
  date: string;
  status: "Ready" | "In-Progress" | "Pending Analysis";
  specimenType?: string;
  orderingPhysician: string;
  orderingPhysicianLicense?: string;
  releasedBy: string;
  summary: string;
  items: LabTestItem[];
  // Order & processing details (lab / imaging worklists)
  orderedAt?: string;
  priority?: "Routine" | "Urgent" | "STAT";
  indication?: string;
  performedBy?: string;
  releasedAt?: string;
  /** Radiology findings (imaging studies); `summary` holds the impression. */
  findings?: string;
  /** Imaging: images uploaded by the Radiologic Technologist (file contents live in `imaging_files`). */
  images?: ImagingFileMeta[];
  /** Imaging: set when the technologist sends the study to the radiologist for reading. */
  acquiredBy?: string;
  acquiredAt?: string;
  techNotes?: string;
  /** Lab: released with at least one critical (HH/LL) value; cleared from alerts once acknowledged. */
  critical?: boolean;
  criticalAckBy?: string;
  criticalAckAt?: string;
}

export interface ImagingFileMeta {
  id: string;
  name: string;
  type: string;
  size: number;
}

/** One uploaded imaging file (JPEG/PNG/PDF), stored separately from the result to keep lists light. */
export interface ImagingFile extends ImagingFileMeta {
  resultId: string;
  patientId: string;
  dataUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface MedicationOrder {
  id: string;
  patientId: string;
  patientName: string;
  name: string;
  dose: string;
  route: string;
  freq: string;
  start: string;
  prescribedBy: string;
  prescribedByLicense?: string;
  status: "Active" | "Completed" | "Discontinued";
  refillable: boolean;
  refillStatus?: "Not Requested" | "Pending Approval" | "Approved";
  lastAdministered?: string;
  administeredBy?: string;
  administeredByLicense?: string;
  notes?: string;
  // Pharmacy dispensing
  dispenseQuantity?: string;
  dispensedBy?: string;
  dispensedAt?: string;
  dispenseRemarks?: string;
  /** Every dispensing event; a prescription can be dispensed in parts. */
  dispenses?: DispenseEvent[];
  /** False while only part of the prescription has been given. */
  fullyDispensed?: boolean;
}

export interface TreatmentLog {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  treatmentName: string;
  category: "Bedside Nursing" | "Wound Care" | "IV Therapy" | "Respiratory Therapy" | "Physiotherapy";
  performedBy: string;
  performedByLicense?: string;
  role: string;
  vitalsAtTreatment?: string;
  structuredVitals?: VitalsData;
  fluidIntakeMl?: number;
  urineOutputMl?: number;
  notes: string;
}

export interface AdmissionEntry {
  id: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  ward: string;
  bed: string;
  attendingPhysician: string;
  attendingPhysicianLicense?: string;
  admittingStaff: string;
  reason: string;
  triageTier?: TriageTier;
  status: "Admitted" | "Observation" | "Discharged";
  dischargeDate?: string;
}

export interface VisitorLog {
  id: string;
  patientId: string;
  patientName: string;
  wardBed: string;
  visitorName: string;
  relationship: string;
  contactNumber: string;
  idPresented: string;
  badgeNumber: string;
  timeIn: string;
  timeOut?: string;
  temperatureCelsius?: string;
  purpose?: string;
  status: "Currently Visiting" | "Departed";
  loggedByStaff: string;
}

export interface ShiftEndorsement {
  id: string;
  timestamp: string;
  shiftPeriod: string;
  ward: string;
  outgoingNurse: string;
  outgoingNurseLicense: string;
  incomingNurse: string;
  incomingNurseLicense: string;
  patientCensus: number;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  urgentTasks: string[];
}

export interface HospitalConfig {
  name: string;
  tagline: string;
  logoText: string;
  phone: string;
  emergencyHotline: string;
  email: string;
  dpoEmail: string;
  address: string;
  accreditation: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: Role;
  userLicense?: string;
  action: string;
  targetPatient: string;
  patientId: string;
  department: string;
  ipAddress: string;
  status: "Authorized" | "Flagged";
}

export interface PrivacyConsentSettings {
  allowSpecialistSharing: boolean;
  allowResearchAnonymized: boolean;
  allowSmsNotifications: boolean;
  emergencyOverrideConsent: boolean;
  twoFactorAuth: boolean;
  lastUpdated: string;
}

export type QueueStatus = "Waiting" | "In-Consultation" | "Completed" | "Referred" | "No-Show";

export interface OpdQueueItem {
  id: string;
  queueNumber: number; // 1, 2, 3...
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  triageTier: TriageTier;
  checkInTime: string;
  chiefComplaint: string;
  assignedDoctor: string;
  status: QueueStatus;
  roomOrBooth: string;
}

export interface OpdReferral {
  id: string;
  patientId: string;
  patientName: string;
  referredFrom: string;
  referredTo: string;
  reason: string;
  priority: "Routine" | "Urgent" | "Stat Emergency";
  timestamp: string;
  referringDoctor: string;
  status: "Pending" | "Accepted" | "Completed";
}

export interface OpdDischarge {
  id: string;
  patientId: string;
  patientName: string;
  dischargeDate: string;
  disposition:
    | "Treated & Sent Home"
    | "Admitted to Inpatient Ward"
    | "Transferred to Inpatient Ward"
    | "Transferred to Tertiary Center"
    | "Follow-up Scheduled"
    | "Routine Discharge / Recovered"
    | "Discharged Against Medical Advice (DAMA/AMA)"
    | "Referred to Tertiary Care";
  followUpDate?: string;
  instructions: string;
  clearedByDoctor: string;
  dischargeSummary?: string;
  dischargeMeds?: string[];
  attendingDoctor?: string;
  /** Condition confirmed by the doctor at discharge, and the triage level the patient had before. */
  conditionAtDischarge?: string;
  triageBeforeDischarge?: TriageTier;
  /** Receiving hospital when referred / transferred out. */
  referredTo?: string;
}


// ------------------------------------------------------------------------------
// Nursing Station, Duty Shifts & Staff Profile Photos
// ------------------------------------------------------------------------------

export type CarePlanStatus = "Active" | "Goal Met" | "Partially Met" | "Not Met" | "Revised";

/** Nursing Care Plan following the ADPIE process. */
export interface NursingCarePlan {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  updatedAt: string;
  nurse: string;
  // A — Assessment
  subjectiveData: string;
  objectiveData: string;
  // D — Nursing Diagnosis (NANDA-I)
  nursingDiagnosis: string;
  relatedTo: string;
  // P — Planning
  goal: string;
  expectedOutcomes: string;
  // I — Intervention
  interventions: string;
  rationale: string;
  // E — Evaluation
  evaluation: string;
  status: CarePlanStatus;
}

export type DoctorOrderCategory =
  | "Medication"
  | "Laboratory"
  | "Imaging / Diagnostics"
  | "IV Fluids"
  | "Diet"
  | "Activity"
  | "Monitoring"
  | "Nursing Care"
  | "Referral"
  | "Other";

export type DoctorOrderStatus = "Pending" | "Carried Out" | "Discontinued";

export interface DoctorOrder {
  id: string;
  patientId: string;
  patientName: string;
  orderedAt: string;
  orderedBy: string;
  orderedByLicense?: string;
  category: DoctorOrderCategory;
  order: string;
  priority: "Routine" | "Urgent" | "STAT";
  status: DoctorOrderStatus;
  carriedOutBy?: string;
  carriedOutAt?: string;
  remarks?: string;
}

/** Nurses' notes in FDAR format (Focus, Data, Action, Response). */
export interface NurseNote {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  shift: DutyShift;
  nurse: string;
  focus: string;
  data: string;
  action: string;
  response: string;
}

export interface ChiefComplaintEntry {
  id: string;
  patientId: string;
  patientName: string;
  recordedAt: string;
  recordedBy: string;
  complaint: string;
  onset: string;
  duration: string;
  location: string;
  severity: number; // pain / discomfort scale 0-10
  associatedSymptoms: string;
}

/**
 * Nurses and other staff work 8-hour shifts (Morning / Afternoon / Night).
 * Doctors work 12-hour duties (Day Duty / Night Duty). The hospital runs 24 hours.
 */
export type DutyShift = "Morning" | "Afternoon" | "Night" | "Day Duty" | "Night Duty";

/** Start and end hour (0–23) of each shift; an end before the start means it ends the next morning. */
export const SHIFT_TIMES: Record<DutyShift, { start: number; end: number; hours: number }> = {
  Morning: { start: 6, end: 14, hours: 8 },
  Afternoon: { start: 14, end: 22, hours: 8 },
  Night: { start: 22, end: 6, hours: 8 },
  "Day Duty": { start: 6, end: 18, hours: 12 },
  "Night Duty": { start: 18, end: 6, hours: 12 },
};

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "AM" : "PM"}`;

export const DUTY_SHIFT_HOURS: Record<DutyShift, string> = Object.fromEntries(
  (Object.keys(SHIFT_TIMES) as DutyShift[]).map(s => [s, `${hourLabel(SHIFT_TIMES[s].start)} – ${hourLabel(SHIFT_TIMES[s].end)}`])
) as Record<DutyShift, string>;

/** Physicians (doctors and radiologists) take 12-hour duties; everyone else 8-hour shifts. */
export const shiftsForRole = (role: Role): DutyShift[] =>
  role === "doctor" || role === "radiologist" ? ["Day Duty", "Night Duty"] : ["Morning", "Afternoon", "Night"];

/** Shift start/end as timestamps (ms); overnight shifts end the next day. */
export function shiftInterval(date: string, shift: DutyShift): [number, number] {
  const t = SHIFT_TIMES[shift];
  const start = new Date(`${date}T00:00:00`);
  start.setHours(t.start);
  const end = new Date(`${date}T00:00:00`);
  end.setHours(t.end);
  if (t.end <= t.start) end.setDate(end.getDate() + 1);
  return [start.getTime(), end.getTime()];
}

/** True while the shift is in progress (handles overnight shifts that began yesterday). */
export function isOnDuty(entry: { date: string; shift: DutyShift }, now = new Date()): boolean {
  const [a, b] = shiftInterval(entry.date, entry.shift);
  return now.getTime() >= a && now.getTime() < b;
}

export interface ShiftSchedule {
  id: string;
  userId: string;
  staffName: string;
  role: Role;
  date: string; // YYYY-MM-DD
  shift: DutyShift;
  area: string;
  assignedBy: string;
  notes?: string;
}

export interface StaffPhoto {
  id: string; // staff user id
  image: string; // data URL (resized JPEG)
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Pharmacy stock, billing, legal, appointments
// ------------------------------------------------------------------------------

export interface DispenseEvent {
  quantity: number;
  stockId?: string;
  stockLabel?: string;
  remarks?: string;
  by: string;
  at: string;
}

export interface StockItem {
  id: string;
  name: string; // generic name, e.g. "Amoxicillin"
  strength: string; // "500 mg"
  form: string; // "Capsule"
  unit: string; // "capsules"
  quantity: number;
  reorderLevel: number;
  lotNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  unitPrice?: number;
  updatedAt: string;
  updatedBy: string;
}

export interface BillItem {
  description: string;
  category: "Consultation" | "Laboratory" | "Imaging" | "Medicines" | "Room" | "Procedure" | "Other";
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: "Cash" | "Card" | "GCash / E-wallet" | "Bank Transfer" | "HMO";
  orNumber: string;
  at: string;
  by: string;
}

export interface Bill {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  createdBy: string;
  items: BillItem[];
  /** PhilHealth case-rate deduction (peso amount). */
  philhealthDeduction: number;
  discountType: "None" | "Senior Citizen (20%)" | "PWD (20%)" | "Other";
  discountAmount: number;
  payments: Payment[];
  status: "Open" | "Paid" | "Cancelled";
  notes?: string;
}

export interface IncidentReport {
  id: string;
  reportedAt: string;
  reportedBy: string;
  reporterId: string;
  reporterRole: Role;
  occurredAt: string;
  location: string;
  category: "Patient Safety" | "Medication Error" | "Fall / Injury" | "Data Privacy Breach" | "Equipment" | "Staff Conduct" | "Other";
  severity: "Low" | "Moderate" | "High" | "Sentinel";
  patientId?: string;
  patientName?: string;
  description: string;
  immediateAction?: string;
  status: "Open" | "Under Investigation" | "Closed";
  assignedTo?: string;
  resolution?: string;
  closedAt?: string;
}

export interface PrivacyRequest {
  id: string;
  receivedAt: string;
  requesterName: string;
  relationship: "Patient" | "Parent / Guardian" | "Authorized Representative" | "Other";
  patientId?: string;
  patientName?: string;
  type: "Access to records" | "Correction" | "Erasure / Blocking" | "Objection to processing" | "Data portability" | "Complaint";
  details: string;
  dueDate: string;
  status: "Received" | "In Review" | "Completed" | "Denied";
  handledBy?: string;
  response?: string;
  closedAt?: string;
}

export interface Appointment {
  id: string;
  patientId?: string;
  patientName: string;
  contact?: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  status: "Scheduled" | "Checked In" | "Completed" | "Cancelled" | "No-show";
  createdBy: string;
  createdAt: string;
}

// ------------------------------------------------------------------------------
// Patient movement history (admissions, transfers, referrals, discharges, condition changes)
// ------------------------------------------------------------------------------
export type MovementType =
  | "Moved to OPD Ward"
  | "Admitted"
  | "Ward / Bed Transfer"
  | "Referred / Transferred Out"
  | "Discharged"
  | "Sent Home (OPD)"
  | "Condition Updated";

export interface PatientMovement {
  id: string;
  patientId: string;
  patientName: string;
  type: MovementType;
  from?: string;
  to?: string;
  /** Condition (triage) before → after, when it changed. */
  conditionBefore?: TriageTier;
  conditionAfter?: TriageTier;
  details?: string;
  at: string;
  by: string;
  byRole: Role;
  /** Discharge / referral / admission record this entry belongs to. */
  sourceId?: string;
}

// ------------------------------------------------------------------------------
// OPD Ward — minor cases handled by nurses and doctors
// ------------------------------------------------------------------------------
export type OpdCaseType =
  | "URTI / Common Cold / Flu"
  | "Hypertension"
  | "Diabetes Mellitus Type 2"
  | "Asthma / Bronchitis"
  | "Urinary Tract Infection (UTI)"
  | "Acute Gastroenteritis (AGE)"
  | "Other Minor Case";

export interface OpdCaseVitals {
  at: string;
  by: string;
  bp?: string;
  hr?: string;
  rr?: string;
  temp?: string;
  spo2?: string;
  bloodSugar?: string;
  bloodSugarType?: "FBS" | "RBS";
  weight?: string;
  stools?: string; // AGE: number of loose stools / vomiting since last check
  note?: string;
}

export interface OpdCase {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  caseType: OpdCaseType;
  symptoms: string[];
  complaint: string;
  vitals: OpdCaseVitals[];
  redFlags: string[];
  care: { at: string; by: string; what: string }[];
  ordersAppliedAt?: string;
  ordersAppliedBy?: string;
  doctorPlan?: string;
  status: "In OPD Ward" | "Sent Home" | "Admitted" | "Referred / Transferred";
  disposition?: { at: string; by: string; type: string; instructions?: string; followUpDate?: string };
  createdAt: string;
  createdBy: string;
}
