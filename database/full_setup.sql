-- ==============================================================================
-- CarePoint Medical Center — Hospital Information System (HIS)
-- ALL-IN-ONE SQL SETUP SCRIPT (PostgreSQL / Supabase / MySQL)
-- ==============================================================================
-- Copy and paste this entire file into your Supabase SQL Editor or psql console
-- and click RUN to provision all tables, indexes, and initial verified seed data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONS & SETTINGS
-- ------------------------------------------------------------------------------
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
    id VARCHAR(50) PRIMARY KEY,
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
    emergency_contact_name VARCHAR(150),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    philhealth_pin VARCHAR(50),
    philhealth_category VARCHAR(100),
    philhealth_status VARCHAR(50) DEFAULT 'Active / Eligible',
    philhealth_coverage TEXT,
    consent_treatment BOOLEAN DEFAULT TRUE,
    consent_privacy BOOLEAN DEFAULT TRUE,
    consent_notifications BOOLEAN DEFAULT TRUE,
    consent_date DATE DEFAULT CURRENT_DATE,
    witness_staff VARCHAR(150),
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
-- 5. ELECTRONIC HEALTH RECORDS (SOAP NOTES)
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
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
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
-- 10. SPECIALIST REFERRALS (4-STEP PROTOCOL)
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
-- 11. PATIENT DISCHARGES (4-STEP CLEARANCE)
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
-- 12. PHILHEALTH ECLAIMS
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
-- 13. VISITOR LOGS
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
-- 14. CRYPTOGRAPHIC AUDIT LOGS
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
-- PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_triage ON patients(triage_tier);
CREATE INDEX IF NOT EXISTS idx_patients_admission ON patients(admission_status);
CREATE INDEX IF NOT EXISTS idx_opd_queue_status ON opd_queue(status);
CREATE INDEX IF NOT EXISTS idx_health_records_patient ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medication_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_patient ON diagnostic_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatment_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_patient ON opd_referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharges_patient ON opd_discharges(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_name);

-- ------------------------------------------------------------------------------
-- SEED DATA INSERTION
-- ------------------------------------------------------------------------------

-- 1. Hospital Config Seed
INSERT INTO hospital_config (
    id, name, tagline, logo_text, phone, emergency_hotline, email, dpo_email, address, accreditation
) VALUES (
    'carepoint-master-config',
    'CarePoint Medical Center',
    'Compassionate Care. Trusted Service. Better Health.',
    'CarePoint Medical Center',
    '(02) 8920-5000',
    '911',
    'care@carepointmedical.ph',
    'dpo@carepointmedical.ph',
    'CarePoint Complex, National Highway, Metro Manila, Philippines',
    'DOH Licensed Outpatient Healthcare Facility | PhilHealth Accredited'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    emergency_hotline = EXCLUDED.emergency_hotline;

-- 2. 12 Verified Staff Seed
INSERT INTO users (
    id, name, username, password_hash, role, title, department, avatar_initials, license_number, credentials, status, contact_email, contact_phone
) VALUES
('D-001', 'Dr. Mark Arkiel Jacobe', 'dr.jacobe', '$2a$10$carepoint_hashed_pass', 'doctor', 'Founder & Medical Director', 'Executive Medical Directorate', 'MJ', 'PRC Lic. #0089201', 'MD, FACP (Internal Medicine)', 'active', 'm.jacobe@carepointmedical.ph', '+63 (2) 8920-5000 ext. 101'),
('D-002', 'Dr. Roldan Bidar', 'dr.bidar', '$2a$10$carepoint_hashed_pass', 'doctor', 'Attending Physician', 'Outpatient Department', 'RB', 'PRC Lic. #0091442', 'MD, FPCP (Family & Adult Medicine)', 'active', 'r.bidar@carepointmedical.ph', '+63 (2) 8920-5000 ext. 201'),
('ADM-001', 'JP Valebia', 'admin.jp', '$2a$10$carepoint_hashed_pass', 'admin', 'Hospital Administrator', 'Hospital Administration', 'JV', 'HA-PRC #1002', 'MHA, CHA', 'active', 'jp.valebia@carepointmedical.ph', '+63 (2) 8920-5000 ext. 401'),
('N-001', 'Nurse Angelmae Palma, RN', 'nurse.palma', '$2a$10$carepoint_hashed_pass', 'nurse', 'Head Nurse', 'Nursing & Triage Station', 'AP', 'PRC Lic. #0093820', 'RN, MAN, CCRN', 'active', 'a.palma@carepointmedical.ph', '+63 (2) 8920-5000 ext. 301'),
('N-002', 'Nurse Rechel Ann Perez, RN', 'nurse.perez', '$2a$10$carepoint_hashed_pass', 'nurse', 'Staff Nurse', 'Ward & Bedside Care', 'RP', 'PRC Lic. #0096211', 'RN, BSN', 'active', 'r.perez@carepointmedical.ph', '+63 (2) 8920-5000 ext. 302'),
('STF-001', 'Angel Bellen, RMT', 'staff.angel', '$2a$10$carepoint_hashed_pass', 'staff', 'Medical Technologist', 'Clinical Diagnostic Laboratory', 'AB', 'PRC Lic. #0054112', 'RMT, AMT', 'active', 'a.bellen@carepointmedical.ph', '+63 (2) 8920-5000 ext. 501'),
('STF-002', 'Emman Garlitos', 'staff.emman', '$2a$10$carepoint_hashed_pass', 'staff', 'Healthcare Assistant', 'Clinical Support Services', 'EG', 'EMP-HA-008', 'CHA, NC-II', 'active', 'e.garlitos@carepointmedical.ph', '+63 (2) 8920-5000 ext. 502'),
('STF-003', 'Arabella Salazar', 'staff.arabella', '$2a$10$carepoint_hashed_pass', 'staff', 'Patient Services Coordinator', 'Patient Admissions & Care', 'AS', 'EMP-PSC-012', 'BSHM, CHIO', 'active', 'a.salazar@carepointmedical.ph', '+63 (2) 8920-5000 ext. 601'),
('ADM-002', 'Jessa May Angelia', 'admin.jessa', '$2a$10$carepoint_hashed_pass', 'admin', 'Legal Counsel & DPO', 'Legal Compliance & Privacy', 'JA', 'IBP Roll #54219', 'JD, CIPP/A', 'active', 'j.angelia@carepointmedical.ph', '+63 (2) 8920-5000 ext. 402'),
('STF-004', 'Glenda Llarvez', 'staff.glenda', '$2a$10$carepoint_hashed_pass', 'staff', 'Front Desk Receptionist', 'Front Desk & Admissions', 'GL', 'EMP-REC-005', 'BA Communication', 'active', 'g.llarvez@carepointmedical.ph', '+63 (2) 8920-5000 ext. 602'),
('ADM-003', 'Jessa May Dagami', 'admin.dagami', '$2a$10$carepoint_hashed_pass', 'admin', 'Chief Financial Officer', 'Finance & Accounting', 'JD', 'CPA Lic. #0077421', 'CPA, MBA', 'active', 'j.dagami@carepointmedical.ph', '+63 (2) 8920-5000 ext. 701'),
('STF-005', 'Rose Jane Gorospe', 'staff.rose', '$2a$10$carepoint_hashed_pass', 'staff', 'Pharmacy Technician', 'Outpatient Pharmacy', 'RG', 'PRC Lic. #0033190', 'CPhT, BSP', 'active', 'r.gorospe@carepointmedical.ph', '+63 (2) 8920-5000 ext. 801')
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Patients Seed
INSERT INTO patients (
    id, name, dob, age, gender, civil_status, contact, address, blood_type, allergies, chief_complaint, triage_tier, triage_reason, admission_status, ward, bed, attending_physician, registered_at, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, philhealth_pin, philhealth_category, philhealth_status, philhealth_coverage
) VALUES
(
    'P-2024-001', 'Maria Clara Santos', '1989-05-14', 35, 'Female', 'Married', '0917-555-0192', 'Unit 4B, Emerald Tower, Pasig City', 'O+', '["Penicillin (Urticaria)", "Aspirin (Bronchospasm)"]'::jsonb,
    'Recurrent retrosternal chest discomfort radiating to left shoulder on moderate exertion, 2-week history',
    'critical', 'Triage Level 2: Suspected Unstable Angina / Acute Coronary Syndrome', 'Outpatient', 'Outpatient Department', 'Consultation Room 1', 'Dr. Mark Arkiel Jacobe', '2026-09-14',
    'Juan Santos', 'Spouse', '0917-555-0193', '12-059384721-9', 'Direct Contributor - Private', 'Active / Eligible', 'Comprehensive Konsulta & Inpatient Coverage'
),
(
    'P-2024-002', 'Juan Dela Cruz Jr.', '1972-11-23', 51, 'Male', 'Married', '0918-333-8821', '124 Magsaysay Ave., Quezon City', 'A+', '["Sulfa Drugs (Stevens-Johnson risk)"]'::jsonb,
    'Productive cough with yellowish sputum, low-grade fever (38.2°C), and bilateral wheezing x 4 days',
    'observation', 'Triage Level 3: Community-Acquired Pneumonia (Moderate Risk) with underlying COPD', 'Outpatient', 'Outpatient Department', 'Consultation Room 2', 'Dr. Roldan Bidar', '2026-09-14',
    'Elena Dela Cruz', 'Spouse', '0918-333-8822', '03-847201948-2', 'Direct Contributor - Government', 'Active / Eligible', 'Standard Inpatient Benefit Package'
),
(
    'P-2024-003', 'Lourdes Bautista Reyes', '1961-08-03', 63, 'Female', 'Widowed', '0922-777-4410', 'Block 12, Lot 5, San Lorenzo Village, Makati City', 'B+', '["No known drug allergies (NKDA)"]'::jsonb,
    'Routine quarterly hypertension and Type 2 Diabetes Mellitus monitoring; recent fasting blood glucose 156 mg/dL',
    'stable', 'Triage Level 4: Chronic Disease Management / Outpatient Routine Follow-up', 'Outpatient', 'Outpatient Department', 'Consultation Room 1', 'Dr. Mark Arkiel Jacobe', '2026-09-13',
    'Ramon Reyes', 'Son', '0922-777-4411', '09-123456789-0', 'Senior Citizen (RA 10645)', 'Active / Eligible', 'Expanded Senior Citizen Konsulta Benefit'
),
(
    'P-2024-004', 'Eduardo Mendoza Lim', '1998-03-30', 26, 'Male', 'Single', '0905-111-9943', '28 Katipunan Ave., Loyola Heights, Quezon City', 'AB+', '["Paracetamol (Facial edema)", "Ibuprofen (Mild rash)"]'::jsonb,
    'Acute right lower quadrant abdominal pain with tenderness on palpation, anorexia, and nausea x 18 hours',
    'critical', 'Triage Level 2: Acute Abdomen, rule out Acute Appendicitis vs Mesenteric Adenitis', 'Observation', 'Observation Unit', 'Obs Bed 3', 'Dr. Mark Arkiel Jacobe', '2026-09-14',
    'Victoria Lim', 'Mother', '0905-111-9944', '18-472019384-5', 'Direct Contributor - Private', 'Active / Eligible', 'Emergency Surgical Case Rate Ready'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial OPD Queue Seed
INSERT INTO opd_queue (
    id, queue_number, patient_id, patient_name, age, gender, triage_tier, check_in_time, chief_complaint, assigned_doctor, status, room_or_booth
) VALUES
('Q-001', 1, 'P-2024-001', 'Maria Clara Santos', 35, 'Female', 'critical', '08:15 AM', 'Chest pain on moderate exertion', 'Dr. Mark Arkiel Jacobe', 'In-Consultation', 'Room 1'),
('Q-002', 2, 'P-2024-004', 'Eduardo Mendoza Lim', 26, 'Male', 'critical', '08:30 AM', 'Acute RLQ abdominal pain', 'Dr. Mark Arkiel Jacobe', 'Waiting', 'Obs Bed 3'),
('Q-003', 3, 'P-2024-002', 'Juan Dela Cruz Jr.', 51, 'Male', 'observation', '08:45 AM', 'Productive cough, fever (38.2°C)', 'Dr. Roldan Bidar', 'Waiting', 'Room 2'),
('Q-004', 4, 'P-2024-003', 'Lourdes Bautista Reyes', 63, 'Female', 'stable', '09:15 AM', 'Routine HTN/DM2 checkup', 'Dr. Mark Arkiel Jacobe', 'Waiting', 'Room 1')
ON CONFLICT (id) DO NOTHING;

-- 5. Audit Log Seed
INSERT INTO audit_logs (
    id, timestamp, user_name, user_role, user_license, action, target_patient, patient_id, department, ip_address, status, sha256_hash
) VALUES
('AUD-001', '2026-09-14 08:15', 'Dr. Mark Arkiel Jacobe', 'doctor', 'PRC Lic. #0089201', 'Initiated Outpatient Encounter Consultation', 'Maria Clara Santos', 'P-2024-001', 'Outpatient Department', '192.168.10.42', 'Authorized', 'a1f8c3b4e2d7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4'),
('AUD-002', '2026-09-14 08:22', 'Nurse Angelmae Palma, RN', 'nurse', 'PRC Lic. #0093820', 'Recorded Baseline Bedside Vitals (BP 142/90, HR 88, SpO2 98%)', 'Maria Clara Santos', 'P-2024-001', 'Triage Station', '192.168.10.18', 'Authorized', 'b2e9d4c5f3a8b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5'),
('AUD-003', '2026-09-14 08:40', 'JP Valebia', 'admin', 'HA-PRC #1002', 'System Audit Ledger Verification — DPA RA 10173 Routine Inspection', 'System Master', 'ALL', 'Administration', '192.168.10.1', 'Authorized', 'd4a1f6e7b5c0d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7')
ON CONFLICT (id) DO NOTHING;
