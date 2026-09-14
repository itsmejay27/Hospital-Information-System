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

export interface VitalsData {
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  respiratoryRate: number;
  spo2: number;
  temperature: number;
  weightKg?: number;
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
