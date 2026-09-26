# CarePoint Medical Center — Hospital Information System (HIS)
## Database Architecture & Deployment Guide

This document provides complete instructions for deploying, managing, and integrating the database for the **CarePoint Medical Center Hospital Information System (HIS)**.

---

## 1. Architecture Overview

The system employs a **dual-layer database architecture**:

1. **Production Relational SQL Database (`database/`)**:
   - Designed for PostgreSQL, Supabase, MySQL, and enterprise healthcare backends.
   - 14 relational tables enforcing strict foreign keys, enum constraints, and cryptographic SHA-256 audit trails in compliance with **Republic Act No. 10173 (Philippine Data Privacy Act of 2012)**.
2. **Client-Side High-Performance Database (`src/services/db.ts`)**:
   - Reactive **IndexedDB** engine (`CarePointMedicalCenter_HIS_DB`, v1) with local storage fallback.
   - Automatically initializes and seeds on first launch.
   - Persists all clinical encounters, patient admissions, bedside vital entries, medication orders, specialist referrals, discharge records, and staff registrations across browser sessions and tabs.

---

## 2. Relational Schema Reference (`database/schema.sql`)

| Table Name | Description | Key Fields |
|---|---|---|
| `hospital_config` | Master facility metadata, DOH licensing, emergency hotlines, and DPO contacts. | `id`, `name`, `emergency_hotline`, `dpo_email`, `accreditation` |
| `users` | Authenticated physicians, nurses, admissions staff, and system administrators with PRC licenses. | `id`, `username`, `password_hash`, `role`, `license_number`, `credentials` |
| `patients` | Master patient demographic index, emergency next-of-kin, PhilHealth PIN, and legal consents. | `id` (MRN), `name`, `dob`, `gender`, `blood_type`, `allergies`, `triage_tier` |
| `opd_queue` | Real-time outpatient consultation queue with triage acuity tiers and status tracking. | `id`, `queue_number`, `patient_id`, `triage_tier`, `status`, `assigned_doctor` |
| `health_records` | Structured clinical SOAP consultation notes with ICD-10 diagnoses and vital metrics. | `id`, `patient_id`, `record_type`, `doctor`, `diagnosis`, `icd10_code`, `vitals` |
| `medication_orders` | Inpatient and outpatient e-prescriptions with nurse administration logging. | `id`, `patient_id`, `name`, `dose`, `route`, `freq`, `last_administered` |
| `diagnostic_results` | Hematology, Chemistry, Radiology, and Microbiology lab panels with abnormal flags. | `id`, `patient_id`, `test_name`, `category`, `status`, `items` (JSONB) |
| `treatment_logs` | Bedside nursing vitals recordings, fluid intake/output balances, and therapy logs. | `id`, `patient_id`, `treatment_name`, `performed_by`, `fluid_intake_ml` |
| `admission_entries` | Inpatient bed logistics, ward assignments, admission dates, and attending doctors. | `id`, `patient_id`, `ward`, `bed`, `attending_physician`, `status` |
| `opd_referrals` | 4-step specialist transfer records with destination facilities and urgency levels. | `id`, `patient_id`, `referred_to`, `reason`, `priority`, `referring_doctor` |
| `opd_discharges` | 4-step clinical encounter clearances with follow-up schedules and take-home Rx. | `id`, `patient_id`, `disposition`, `follow_up_date`, `instructions`, `cleared_by_doctor` |
| `philhealth_claims` | PhilHealth Konsulta & Expanded Case Rate benefit claim tracking. | `id`, `patient_id`, `pin`, `case_rate_amount`, `hospital_charges`, `claim_status` |
| `visitor_logs` | Hospital entrance visitor badges, patient ward visits, and departure logging. | `id`, `patient_id`, `visitor_name`, `badge_number`, `time_in`, `status` |
| `audit_logs` | Tamper-evident, cryptographic SHA-256 access and transaction ledger. | `id`, `timestamp`, `user_name`, `action`, `target_patient`, `sha256_hash` |

---

## 3. SQL Database Setup Instructions

### Option A: Supabase (used by the deployed web app)
The web app talks to Supabase directly when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set (see `.env.example`; on Vercel, add them under Project Settings → Environment Variables). Without them it runs on the browser-only IndexedDB store with the demo logins.

1. In the Supabase **SQL Editor**, run `database/supabase_setup.sql`. It creates one table per app store (records kept as `jsonb`) and Row Level Security that only lets **signed-in, linked staff** read or write.
2. Create each staff login under **Authentication → Users → Add user** (tick *Auto Confirm User*).
3. Link the login to a staff profile id (`D-001`, `N-001`, `A-001`, … from `src/mockData.ts`):
   ```sql
   insert into public.staff_accounts (auth_id, user_id)
   select id, 'D-001' from auth.users where email = 'doctor@example.com';
   ```
4. Recommended: turn off **Authentication → Sign In / Providers → Allow new users to sign up**. Unlinked sign-ups can't see data anyway, but there's no reason to allow them.

On the first staff sign-in, empty tables are seeded with the demo data from `src/mockData.ts`.

> `database/full_setup.sql` is a separate, fully relational schema kept as a reference design; the web app does not use it.

### Option B: Local PostgreSQL or MySQL
1. Connect to your database instance:
   ```bash
   psql -U postgres -d carepoint_his
   ```
2. Execute the setup script:
   ```bash
   \i database/full_setup.sql
   ```
3. Verify that the tables and seed data are initialized:
   ```sql
   SELECT count(*) FROM users;    -- Expected: 12
   SELECT count(*) FROM patients; -- Expected: 4+
   ```

---

## 4. Client IndexedDB Storage Operations

The application integrates `src/services/db.ts` to provide persistent storage directly inside the browser.

### Automatic Seeding & Hydration
- When the application starts, `OpdDataContext` initializes `CarePointMedicalCenter_HIS_DB`.
- If stores are empty, the 12 verified staff members and initial clinical patients are automatically seeded.

### Programmatic Database Management
From the Developer Console or administrative controls, you can trigger database utilities:

```typescript
import { hospitalDb } from "./services/db";

// Export entire database as JSON:
const jsonBackup = await hospitalDb.exportDatabaseToJson();
console.log(jsonBackup);

// Reset database to initial hospital factory seed:
await hospitalDb.resetDatabaseToDefaults();
```

---

## 5. Verified Healthcare Team Accounts (Database Seed)

| Staff Member | Role | Title | License / Credential |
|---|---|---|---|
| **Dr. Mark Arkiel Jacobe** | `doctor` | Founder & Medical Director | PRC Lic. #0089201 • MD, FACP |
| **Dr. Roldan Bidar** | `doctor` | Attending Physician | PRC Lic. #0091442 • MD, FPCP |
| **JP Valebia** | `admin` | Hospital Administrator | HA-PRC #1002 • MHA, CHA |
| **Nurse Angelmae Palma, RN** | `nurse` | Head Nurse (Triage Station) | PRC Lic. #0093820 • RN, MAN, CCRN |
| **Nurse Rechel Ann Perez, RN** | `nurse` | Staff Nurse (Ward & Bedside) | PRC Lic. #0096211 • RN, BSN |
| **Angel Bellen, RMT** | `staff` | Medical Technologist | PRC Lic. #0054112 • RMT, AMT |
| **Emman Garlitos** | `staff` | Healthcare Assistant | EMP-HA-008 • CHA, NC-II |
| **Arabella Salazar** | `staff` | Patient Services Coordinator | EMP-PSC-012 • BSHM, CHIO |
| **Jessa May Angelia** | `admin` | Legal Counsel & DPO | IBP Roll #54219 • JD, CIPP/A |
| **Glenda Llarvez** | `staff` | Front Desk Receptionist | EMP-REC-005 • BA Communication |
| **Jessa May Dagami** | `admin` | Chief Financial Officer | CPA Lic. #0077421 • CPA, MBA |
| **Rose Jane Gorospe** | `staff` | Pharmacy Technician | PRC Lic. #0033190 • CPhT, BSP |

*Default demonstration password for all verified accounts: `pass`.*
