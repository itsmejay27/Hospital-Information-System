export type Role = "doctor" | "nurse" | "staff" | "admin";

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
  flag: "H" | "L" | null;
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

export type DutyShift = "Morning" | "Afternoon" | "Night";

export const DUTY_SHIFT_HOURS: Record<DutyShift, string> = {
  Morning: "06:00 – 14:00",
  Afternoon: "14:00 – 22:00",
  Night: "22:00 – 06:00",
};

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
