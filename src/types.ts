export type Role = "patient" | "doctor" | "nurse" | "staff" | "admin";

export type Page =
  | "home"
  | "about"
  | "departments"
  | "announcements"
  | "staff"
  | "contact"
  | "dashboard"
  | "records"                // 2. Creation and updating of electronic health records
  | "lab"                    // 5. Laboratory and diagnostic result retrieval
  | "medications"            // 3. Medication and treatment recording
  | "registration-admission" // 1. Patient registration and admission
  | "privacy";               // 4. Data privacy and confidentiality

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  department: string;
  avatarInitials: string;
  patientId?: string; // Links to patient record if role === "patient"
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
  admissionStatus: "Outpatient" | "Admitted" | "Observation" | "Discharged";
  ward?: string;
  bed?: string;
  attendingPhysician?: string;
  admissionDate?: string;
  registeredAt: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  type: "OPD Visit" | "Inpatient Progress" | "Emergency Consultation" | "Specialist Follow-up";
  doctor: string;
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
  status: "Active" | "Completed" | "Discontinued";
  refillable: boolean;
  refillStatus?: "Not Requested" | "Pending Approval" | "Approved";
  lastAdministered?: string;
  administeredBy?: string;
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
  role: string;
  vitalsAtTreatment?: string;
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
  admittingStaff: string;
  reason: string;
  status: "Admitted" | "Observation" | "Discharged";
  dischargeDate?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: Role;
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
