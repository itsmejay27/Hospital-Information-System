// ==============================================================================
// CarePoint Medical Center — Hospital Information System (HIS)
// High-Performance Browser Database Service (IndexedDB + Local Storage Fallback)
// When Supabase is configured, it is the source of truth and IndexedDB acts as
// an offline cache: reads come from Supabase, writes go to both. Supabase access
// requires a signed-in staff account (see database/supabase_setup.sql).
// ==============================================================================

import {
  Patient,
  OpdQueueItem,
  HealthRecord,
  DiagnosticResult,
  MedicationOrder,
  TreatmentLog,
  AdmissionEntry,
  OpdReferral,
  OpdDischarge,
  PhilHealthClaim,
  VisitorLog,
  AuditLog,
  HospitalConfig,
  User,
  QueueStatus,
} from "../types";
import {
  INITIAL_PATIENTS,
  INITIAL_OPD_QUEUE,
  INITIAL_HEALTH_RECORDS,
  INITIAL_LAB_RESULTS,
  INITIAL_MEDICATIONS,
  INITIAL_TREATMENTS,
  INITIAL_ADMISSIONS,
  INITIAL_OPD_REFERRALS,
  INITIAL_OPD_DISCHARGES,
  INITIAL_PHILHEALTH_CLAIMS,
  INITIAL_VISITOR_LOGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_HOSPITAL_CONFIG,
  DEMO_USERS,
} from "../mockData";
import { supabase } from "./supabase";

const DB_NAME = "CarePointMedicalCenter_HIS_DB";
const DB_VERSION = 1;

const STORES = [
  "patients",
  "opd_queue",
  "health_records",
  "medication_orders",
  "diagnostic_results",
  "treatment_logs",
  "admission_entries",
  "opd_referrals",
  "opd_discharges",
  "philhealth_claims",
  "visitor_logs",
  "audit_logs",
  "hospital_config",
  "users",
];

export interface DatabaseState {
  patients: Patient[];
  queue: OpdQueueItem[];
  records: HealthRecord[];
  medications: MedicationOrder[];
  labResults: DiagnosticResult[];
  treatments: TreatmentLog[];
  admissions: AdmissionEntry[];
  referrals: OpdReferral[];
  discharges: OpdDischarge[];
  claims: PhilHealthClaim[];
  visitorLogs: VisitorLog[];
  auditLogs: AuditLog[];
  hospitalConfig: HospitalConfig;
  users: User[];
}

class CarePointDatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDBAvailable: boolean;

  constructor() {
    this.isIndexedDBAvailable = typeof window !== "undefined" && "indexedDB" in window;
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable) {
      return Promise.reject(new Error("IndexedDB is not supported in this environment."));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          STORES.forEach((storeName) => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: "id" });
            }
          });
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  // --- Local (IndexedDB / LocalStorage) Store Operations ---
  private async localGetAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // LocalStorage fallback
      const key = `carepoint_${storeName}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    }
  }

  private async localPut<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // LocalStorage fallback
      const key = `carepoint_${storeName}`;
      const existing = await this.localGetAll<T>(storeName);
      const index = existing.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        existing[index] = item;
      } else {
        existing.push(item);
      }
      localStorage.setItem(key, JSON.stringify(existing));
    }
  }

  private async localBulkPut<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        items.forEach((item) => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const key = `carepoint_${storeName}`;
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  private async localReplaceAll<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.clear();
        items.forEach((item) => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      localStorage.setItem(`carepoint_${storeName}`, JSON.stringify(items));
    }
  }

  // --- Remote (Supabase) Store Operations ---
  // Each table keeps the app object as-is in a `data` jsonb column keyed by `id`.
  private async remoteGetAll<T>(storeName: string): Promise<T[]> {
    const { data, error } = await supabase!.from(storeName).select("data");
    if (error) throw error;
    return (data ?? []).map((row: { data: T }) => row.data);
  }

  private async remoteUpsert<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    if (items.length === 0) return;
    const now = new Date().toISOString();
    const { error } = await supabase!
      .from(storeName)
      .upsert(items.map((item) => ({ id: item.id, data: item, updated_at: now })));
    if (error) throw error;
  }

  // --- Generic Store Operations ---
  private async getAllFromStore<T extends { id: string }>(storeName: string): Promise<T[]> {
    if (supabase) {
      try {
        const items = await this.remoteGetAll<T>(storeName);
        this.localReplaceAll(storeName, items).catch(console.error);
        return items;
      } catch (err) {
        console.warn(`Supabase read failed for "${storeName}", using local cache:`, err);
      }
    }
    return this.localGetAll<T>(storeName);
  }

  private async putInStore<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    await this.localPut(storeName, item);
    if (supabase) await this.remoteUpsert(storeName, [item]);
  }

  private async bulkPutInStore<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    await this.localBulkPut(storeName, items);
    if (supabase) await this.remoteUpsert(storeName, items);
  }

  // --- Seed Initialization ---
  public async initializeDatabase(): Promise<DatabaseState> {
    const existingPatients = await this.getAllFromStore<Patient>("patients");

    if (!existingPatients || existingPatients.length === 0) {
      // Seed all initial records
      await Promise.all([
        this.bulkPutInStore("patients", INITIAL_PATIENTS),
        this.bulkPutInStore("opd_queue", INITIAL_OPD_QUEUE),
        this.bulkPutInStore("health_records", INITIAL_HEALTH_RECORDS),
        this.bulkPutInStore("medication_orders", INITIAL_MEDICATIONS),
        this.bulkPutInStore("diagnostic_results", INITIAL_LAB_RESULTS),
        this.bulkPutInStore("treatment_logs", INITIAL_TREATMENTS),
        this.bulkPutInStore("admission_entries", INITIAL_ADMISSIONS),
        this.bulkPutInStore("opd_referrals", INITIAL_OPD_REFERRALS),
        this.bulkPutInStore("opd_discharges", INITIAL_OPD_DISCHARGES),
        this.bulkPutInStore("philhealth_claims", INITIAL_PHILHEALTH_CLAIMS),
        this.bulkPutInStore("visitor_logs", INITIAL_VISITOR_LOGS),
        this.bulkPutInStore("audit_logs", INITIAL_AUDIT_LOGS),
        this.putInStore("hospital_config", { id: "master-config", ...INITIAL_HOSPITAL_CONFIG }),
        this.bulkPutInStore("users", Object.values(DEMO_USERS).map((u) => u.user)),
      ]);
    }

    return this.loadFullState();
  }

  public async loadFullState(): Promise<DatabaseState> {
    const [
      patients,
      queue,
      records,
      medications,
      labResults,
      treatments,
      admissions,
      referrals,
      discharges,
      claims,
      visitorLogs,
      auditLogs,
      configList,
      users,
    ] = await Promise.all([
      this.getAllFromStore<Patient>("patients"),
      this.getAllFromStore<OpdQueueItem>("opd_queue"),
      this.getAllFromStore<HealthRecord>("health_records"),
      this.getAllFromStore<MedicationOrder>("medication_orders"),
      this.getAllFromStore<DiagnosticResult>("diagnostic_results"),
      this.getAllFromStore<TreatmentLog>("treatment_logs"),
      this.getAllFromStore<AdmissionEntry>("admission_entries"),
      this.getAllFromStore<OpdReferral>("opd_referrals"),
      this.getAllFromStore<OpdDischarge>("opd_discharges"),
      this.getAllFromStore<PhilHealthClaim>("philhealth_claims"),
      this.getAllFromStore<VisitorLog>("visitor_logs"),
      this.getAllFromStore<AuditLog>("audit_logs"),
      this.getAllFromStore<HospitalConfig & { id: string }>("hospital_config"),
      this.getAllFromStore<User>("users"),
    ]);

    const hospitalConfig = configList.length > 0 ? configList[0] : INITIAL_HOSPITAL_CONFIG;

    return {
      patients: patients.length > 0 ? patients : INITIAL_PATIENTS,
      queue: queue.length > 0 ? queue : INITIAL_OPD_QUEUE,
      records: records.length > 0 ? records : INITIAL_HEALTH_RECORDS,
      medications: medications.length > 0 ? medications : INITIAL_MEDICATIONS,
      labResults: labResults.length > 0 ? labResults : INITIAL_LAB_RESULTS,
      treatments: treatments.length > 0 ? treatments : INITIAL_TREATMENTS,
      admissions: admissions.length > 0 ? admissions : INITIAL_ADMISSIONS,
      referrals: referrals.length > 0 ? referrals : INITIAL_OPD_REFERRALS,
      discharges: discharges.length > 0 ? discharges : INITIAL_OPD_DISCHARGES,
      claims: claims.length > 0 ? claims : INITIAL_PHILHEALTH_CLAIMS,
      visitorLogs: visitorLogs.length > 0 ? visitorLogs : INITIAL_VISITOR_LOGS,
      auditLogs: auditLogs.length > 0 ? auditLogs : INITIAL_AUDIT_LOGS,
      hospitalConfig: hospitalConfig || INITIAL_HOSPITAL_CONFIG,
      users: users.length > 0 ? users : Object.values(DEMO_USERS).map((u) => u.user),
    };
  }

  // --- Specific CRUD APIs ---
  public async savePatient(patient: Patient): Promise<void> {
    await this.putInStore("patients", patient);
  }

  public async saveQueue(queue: OpdQueueItem[]): Promise<void> {
    await this.bulkPutInStore("opd_queue", queue);
  }

  public async saveRecord(record: HealthRecord): Promise<void> {
    await this.putInStore("health_records", record);
  }

  public async saveMedication(med: MedicationOrder): Promise<void> {
    await this.putInStore("medication_orders", med);
  }

  public async saveLabResult(lab: DiagnosticResult): Promise<void> {
    await this.putInStore("diagnostic_results", lab);
  }

  public async saveTreatment(treatment: TreatmentLog): Promise<void> {
    await this.putInStore("treatment_logs", treatment);
  }

  public async saveAdmission(admission: AdmissionEntry): Promise<void> {
    await this.putInStore("admission_entries", admission);
  }

  public async saveReferral(referral: OpdReferral): Promise<void> {
    await this.putInStore("opd_referrals", referral);
  }

  public async saveDischarge(discharge: OpdDischarge): Promise<void> {
    await this.putInStore("opd_discharges", discharge);
  }

  public async saveClaim(claim: PhilHealthClaim): Promise<void> {
    await this.putInStore("philhealth_claims", claim);
  }

  public async saveClaims(claims: PhilHealthClaim[]): Promise<void> {
    await this.bulkPutInStore("philhealth_claims", claims);
  }

  public async saveVisitorLog(log: VisitorLog): Promise<void> {
    await this.putInStore("visitor_logs", log);
  }

  public async saveAuditLog(log: AuditLog): Promise<void> {
    await this.putInStore("audit_logs", log);
  }

  public async saveUser(user: User): Promise<void> {
    await this.putInStore("users", user);
  }

  public async saveHospitalConfig(config: HospitalConfig): Promise<void> {
    await this.putInStore("hospital_config", { id: "master-config", ...config });
  }

  // --- Database Export / Import Utilities ---
  public async exportDatabaseToJson(): Promise<string> {
    const fullState = await this.loadFullState();
    return JSON.stringify(
      {
        institution: "CarePoint Medical Center",
        system: "Hospital Information System (HIS)",
        exportTimestamp: new Date().toISOString(),
        version: DB_VERSION,
        data: fullState,
      },
      null,
      2
    );
  }

  public async resetDatabaseToDefaults(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORES, "readwrite");
      STORES.forEach((s) => tx.objectStore(s).clear());
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      localStorage.clear();
    }

    if (supabase) {
      await Promise.all(
        STORES.map(async (storeName) => {
          const { error } = await supabase!.from(storeName).delete().neq("id", "");
          if (error) throw error;
        })
      );
    }

    await this.initializeDatabase();
  }
}

export const hospitalDb = new CarePointDatabaseService();
