-- ==============================================================================
-- CarePoint Medical Center — Hospital Information System (HIS)
-- Production Seed Data (PostgreSQL / Supabase / MySQL)
-- ==============================================================================

-- 1. HOSPITAL CONFIGURATION
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

-- 2. VERIFIED 12-MEMBER HEALTHCARE TEAM DIRECTORY
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

-- 3. INITIAL MASTER PATIENT REGISTRY
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
),
(
    'P-2024-005', 'Corazon Aquino Villanueva', '1979-12-08', 44, 'Female', 'Married', '0939-888-2234', '77 Bonifacio Drive, BGC, Taguig City', 'O+', '["Ciprofloxacin (Tendonitis sensation)"]'::jsonb,
    'Persistent bilateral knee joint pain, morning stiffness lasting >45 minutes, elevated uric acid (8.4 mg/dL)',
    'stable', 'Triage Level 4: Musculoskeletal / Gouty Arthritis vs Osteoarthritis evaluation', 'Outpatient', 'Outpatient Department', 'Consultation Room 2', 'Dr. Roldan Bidar', '2026-09-12',
    'Nestor Villanueva', 'Spouse', '0939-888-2235', '21-987654321-3', 'Direct Contributor - Private', 'Active / Eligible', 'OPD Diagnostic & Therapeutic Coverage'
),
(
    'P-2024-006', 'Benjamin Tolentino Cruz', '1955-04-19', 69, 'Male', 'Married', '0920-444-6677', '55 Dahlia St., Fairview, Quezon City', 'A-', '["ACE Inhibitors (Intractable dry cough)"]'::jsonb,
    'Chronic stable ischemic heart disease follow-up, bilateral lower extremity pitting edema (+1), dyspnea on exertion',
    'observation', 'Triage Level 3: Congestive Heart Failure NYHA Class II decompensation watch', 'Outpatient', 'Outpatient Department', 'Consultation Room 1', 'Dr. Mark Arkiel Jacobe', '2026-09-11',
    'Norma Cruz', 'Spouse', '0920-444-6678', '05-334455667-1', 'Senior Citizen (RA 10645)', 'Active / Eligible', 'PhilHealth Expanded Case Rates'
)
ON CONFLICT (id) DO NOTHING;

-- 4. OPD LIVE QUEUE INITIAL SEED
INSERT INTO opd_queue (
    id, queue_number, patient_id, patient_name, age, gender, triage_tier, check_in_time, chief_complaint, assigned_doctor, status, room_or_booth
) VALUES
('Q-001', 1, 'P-2024-001', 'Maria Clara Santos', 35, 'Female', 'critical', '08:15 AM', 'Chest pain on moderate exertion', 'Dr. Mark Arkiel Jacobe', 'In-Consultation', 'Room 1'),
('Q-002', 2, 'P-2024-004', 'Eduardo Mendoza Lim', 26, 'Male', 'critical', '08:30 AM', 'Acute RLQ abdominal pain', 'Dr. Mark Arkiel Jacobe', 'Waiting', 'Obs Bed 3'),
('Q-003', 3, 'P-2024-002', 'Juan Dela Cruz Jr.', 51, 'Male', 'observation', '08:45 AM', 'Productive cough, fever (38.2°C)', 'Dr. Roldan Bidar', 'Waiting', 'Room 2'),
('Q-004', 4, 'P-2024-006', 'Benjamin Tolentino Cruz', 69, 'Male', 'observation', '09:00 AM', 'Ischemic heart disease, leg edema', 'Dr. Mark Arkiel Jacobe', 'Waiting', 'Room 1'),
('Q-005', 5, 'P-2024-003', 'Lourdes Bautista Reyes', 63, 'Female', 'stable', '09:15 AM', 'Routine HTN/DM2 checkup', 'Dr. Mark Arkiel Jacobe', 'Waiting', 'Room 1'),
('Q-006', 6, 'P-2024-005', 'Corazon Aquino Villanueva', 44, 'Female', 'stable', '09:30 AM', 'Bilateral knee joint pain', 'Dr. Roldan Bidar', 'Waiting', 'Room 2')
ON CONFLICT (id) DO NOTHING;

-- 5. INITIAL AUDIT LOGS (TAMPER-EVIDENT CRYPTOGRAPHIC LOGS)
INSERT INTO audit_logs (
    id, timestamp, user_name, user_role, user_license, action, target_patient, patient_id, department, ip_address, status, sha256_hash
) VALUES
('AUD-001', '2026-09-14 08:15', 'Dr. Mark Arkiel Jacobe', 'doctor', 'PRC Lic. #0089201', 'Initiated Outpatient Encounter Consultation', 'Maria Clara Santos', 'P-2024-001', 'Outpatient Department', '192.168.10.42', 'Authorized', 'a1f8c3b4e2d7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4'),
('AUD-002', '2026-09-14 08:22', 'Nurse Angelmae Palma, RN', 'nurse', 'PRC Lic. #0093820', 'Recorded Baseline Bedside Vitals (BP 142/90, HR 88, SpO2 98%)', 'Maria Clara Santos', 'P-2024-001', 'Triage Station', '192.168.10.18', 'Authorized', 'b2e9d4c5f3a8b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5'),
('AUD-003', '2026-09-14 08:35', 'Dr. Mark Arkiel Jacobe', 'doctor', 'PRC Lic. #0089201', 'Ordered Diagnostic Cardiac Enzyme Panel (Troponin-I, CK-MB)', 'Maria Clara Santos', 'P-2024-001', 'Outpatient Department', '192.168.10.42', 'Authorized', 'c3f0e5d6a4b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'),
('AUD-004', '2026-09-14 08:40', 'JP Valebia', 'admin', 'HA-PRC #1002', 'System Audit Ledger Verification — DPA RA 10173 Routine Inspection', 'System Master', 'ALL', 'Administration', '192.168.10.1', 'Authorized', 'd4a1f6e7b5c0d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7')
ON CONFLICT (id) DO NOTHING;
