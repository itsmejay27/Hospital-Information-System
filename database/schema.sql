-- ==============================================================================
-- CarePoint Medical Center — Hospital Information System (HIS)
-- Production Relational Database Schema (PostgreSQL / Supabase / MySQL)
-- ==============================================================================
-- Facility: CarePoint Medical Center
-- Level: DOH Level 3 Tertiary Teaching Hospital & Outpatient Center
-- Medical Director & Founder: Dr. Mark Arkiel Jacobe, MD, FACP
-- Compliance: Republic Act No. 10173 (Philippine Data Privacy Act of 2012)
-- ==============================================================================

-- Enable UUID Extension if PostgreSQL / Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. HOSPITAL CONFIGURATION & INSTITUTIONAL METADATA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'carepoint-master-config',
    name VARCHAR(255) NOT NULL DEFAULT 'CarePoint Medical Center',
    tagline VARCHAR(255) NOT NULL DEFAULT 'Compassionate Care. Trusted Service. Better Health.',
    logo_text VARCHAR(255) NOT NULL DEFAULT 'CarePoint Medical Center',
    phone VARCHAR(50) NOT NULL DEFAULT '(02) 8920-5000',
    emergency_hotline VARCHAR(50) NOT NULL DEFAULT '911',
    email VARCHAR(100) NOT NULL DEFAULT 'care@carepointmedical.ph',
    dpo_email VARCHAR(100) NOT NULL DEFAULT 'dpo@carepointmedical.ph',
    address TEXT NOT NULL DEFAULT 'CarePoint Complex, National Highway, Metro Manila, Philippines',
    accreditation TEXT NOT NULL DEFAULT 'DOH Licensed Outpatient Healthcare Facility | PhilHealth Accredited',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. USERS, CLINICIANS & STAFF DIRECTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'nurse', 'staff', 'admin')),
    title VARCHAR(150) NOT NULL,
    department VARCHAR(150) NOT NULL,
    avatar_initials VARCHAR(10) NOT NULL,
    license_number VARCHAR(100),
    credentials VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. PATIENT MASTER REGISTRY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY, -- Medical Record Number (MRN e.g. P-2024-001)
    name VARCHAR(150) NOT NULL,
    dob DATE NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Female', 'Male', 'Other')),
    civil_status VARCHAR(50) NOT NULL DEFAULT 'Single',
    contact VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    blood_type VARCHAR(10) NOT NULL DEFAULT 'O+',
    allergies JSONB DEFAULT '["None reported"]'::jsonb,
    chief_complaint TEXT NOT NULL,
    triage_tier VARCHAR(20) NOT NULL DEFAULT 'stable' CHECK (triage_tier IN ('stable', 'observation', 'critical')),
    triage_reason TEXT,
    admission_status VARCHAR(30) NOT NULL DEFAULT 'Outpatient' CHECK (admission_status IN ('Outpatient', 'Admitted', 'Observation', 'Discharged')),
    ward VARCHAR(100),
    bed VARCHAR(50),
    attending_physician VARCHAR(150),
    admission_date DATE,
    registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Next of Kin / Emergency Contact
    emergency_contact_name VARCHAR(150),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    
    -- PhilHealth Insurance Details
    philhealth_pin VARCHAR(50),
    philhealth_category VARCHAR(100),
    philhealth_status VARCHAR(50) DEFAULT 'Active / Eligible',
    philhealth_coverage TEXT,
    
    -- Digital Legal Consents (RA 10173)
    consent_treatment BOOLEAN DEFAULT TRUE,
    consent_privacy BOOLEAN DEFAULT TRUE,
    consent_notifications BOOLEAN DEFAULT TRUE,
    consent_date DATE DEFAULT CURRENT_DATE,
    witness_staff VARCHAR(150),
    
    -- Past Medical History
    medical_history JSONB DEFAULT '{"pastMedical":[],"pastSurgical":[],"familyHistory":[],"chronicConditions":[]}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. OUTPATIENT DEPARTMENT (OPD) QUEUE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opd_queue (
    id VARCHAR(50) PRIMARY KEY,
    queue_number INT NOT NULL,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    triage_tier VARCHAR(20) NOT NULL CHECK (triage_tier IN ('stable', 'observation', 'critical')),
    check_in_time VARCHAR(20) NOT NULL,
    chief_complaint TEXT NOT NULL,
    assigned_doctor VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'In-Consultation', 'Completed', 'Referred', 'No-Show')),
    room_or_booth VARCHAR(50) NOT NULL DEFAULT 'Room 1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. ELECTRONIC HEALTH RECORDS (SOAP CLINICAL NOTES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_records (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    record_date DATE NOT NULL,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('OPD Visit', 'Inpatient Progress', 'Emergency Consultation', 'Specialist Follow-up')),
    doctor VARCHAR(150) NOT NULL,
    doctor_license VARCHAR(100),
    diagnosis TEXT NOT NULL,
    icd10_code VARCHAR(50),
    differential_diagnosis JSONB DEFAULT '[]'::jsonb,
    subjective TEXT NOT NULL,
    objective TEXT NOT NULL,
    assessment TEXT NOT NULL,
    plan TEXT NOT NULL,
    notes TEXT,
    internal_clinician_notes TEXT,
    vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. MEDICATIONS & E-PRESCRIPTION ORDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medication_orders (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    name VARCHAR(150) NOT NULL,
    dose VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL,
    freq VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    prescribed_by VARCHAR(150) NOT NULL,
    prescribed_by_license VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Discontinued')),
    refillable BOOLEAN DEFAULT FALSE,
    refill_status VARCHAR(50) DEFAULT 'Not Requested',
    last_administered TIMESTAMP WITH TIME ZONE,
    administered_by VARCHAR(150),
    administered_by_license VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. DIAGNOSTIC LABORATORY & RADIOLOGY RESULTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnostic_results (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    test_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hematology', 'Clinical Chemistry', 'Radiology', 'Microbiology', 'Cardiology')),
    test_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Ready' CHECK (status IN ('Ready', 'In-Progress', 'Pending Analysis')),
    specimen_type VARCHAR(100),
    ordering_physician VARCHAR(150) NOT NULL,
    ordering_physician_license VARCHAR(100),
    released_by VARCHAR(150) NOT NULL,
    summary TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, value, ref, flag, unit}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. BEDSIDE NURSING TREATMENT & VITALS LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatment_logs (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    treatment_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Bedside Nursing', 'Wound Care', 'IV Therapy', 'Respiratory Therapy', 'Physiotherapy')),
    performed_by VARCHAR(150) NOT NULL,
    performed_by_license VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    vitals_at_treatment VARCHAR(100),
    structured_vitals JSONB,
    fluid_intake_ml INT,
    urine_output_ml INT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 9. INPATIENT ADMISSIONS & BED ALLOCATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admission_entries (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    admission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ward VARCHAR(100) NOT NULL,
    bed VARCHAR(50) NOT NULL,
    attending_physician VARCHAR(150) NOT NULL,
    attending_physician_license VARCHAR(100),
    admitting_staff VARCHAR(150) NOT NULL,
    reason TEXT NOT NULL,
    triage_tier VARCHAR(20) DEFAULT 'observation',
    status VARCHAR(30) NOT NULL DEFAULT 'Admitted' CHECK (status IN ('Admitted', 'Observation', 'Discharged')),
    discharge_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 10. SPECIALIST REFERRALS (4-STEP WORKFLOW)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opd_referrals (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    referred_from VARCHAR(150) NOT NULL DEFAULT 'CarePoint Outpatient Department',
    referred_to VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    priority VARCHAR(30) NOT NULL CHECK (priority IN ('Routine', 'Urgent', 'Stat Emergency')),
    timestamp VARCHAR(50) NOT NULL,
    referring_doctor VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 11. PATIENT DISCHARGES (4-STEP PROTOCOL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opd_discharges (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    discharge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    disposition VARCHAR(100) NOT NULL,
    follow_up_date DATE,
    instructions TEXT NOT NULL,
    cleared_by_doctor VARCHAR(150) NOT NULL,
    discharge_summary TEXT,
    discharge_meds JSONB DEFAULT '[]'::jsonb,
    attending_doctor VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 12. PHILHEALTH ECLAIMS & KONSULTA PACKAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS philhealth_claims (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    pin VARCHAR(50) NOT NULL,
    member_name VARCHAR(150) NOT NULL,
    membership_type VARCHAR(100) NOT NULL,
    diagnosis_with_icd VARCHAR(255) NOT NULL,
    case_rate_amount VARCHAR(100) NOT NULL,
    claim_status VARCHAR(50) NOT NULL CHECK (claim_status IN ('Ready for Submission', 'Transmitted', 'Under Adjudication', 'Approved / Reimbursed', 'Returned / Pending Docs')),
    submission_date DATE,
    hospital_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    philhealth_benefit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    patient_payable NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 13. FRONT DESK VISITOR PASS & SECURITY LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitor_logs (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    ward_bed VARCHAR(100) NOT NULL,
    visitor_name VARCHAR(150) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    id_presented VARCHAR(100) NOT NULL,
    badge_number VARCHAR(50) NOT NULL,
    time_in VARCHAR(50) NOT NULL,
    time_out VARCHAR(50),
    temperature_celsius VARCHAR(20),
    purpose VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'Currently Visiting' CHECK (status IN ('Currently Visiting', 'Departed')),
    logged_by_staff VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 14. CRYPTOGRAPHIC TAMPER-EVIDENT AUDIT TRAIL (RA 10173)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp VARCHAR(50) NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    user_license VARCHAR(100),
    action VARCHAR(255) NOT NULL,
    target_patient VARCHAR(150) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    department VARCHAR(150) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Authorized' CHECK (status IN ('Authorized', 'Flagged')),
    sha256_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR QUERY OPTIMIZATION
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_triage ON patients(triage_tier);
CREATE INDEX IF NOT EXISTS idx_patients_admission ON patients(admission_status);
CREATE INDEX IF NOT EXISTS idx_opd_queue_status ON opd_queue(status);
CREATE INDEX IF NOT EXISTS idx_health_records_patient ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medication_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medication_orders(status);
CREATE INDEX IF NOT EXISTS idx_diagnostics_patient ON diagnostic_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatment_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_patient ON opd_referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharges_patient ON opd_discharges(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at DESC);
