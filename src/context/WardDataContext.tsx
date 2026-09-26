import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  NursingCarePlan,
  DoctorOrder,
  NurseNote,
  ChiefComplaintEntry,
  ShiftSchedule,
  StaffPhoto,
} from "../types";
import { hospitalDb } from "../services/db";
import { isSupabaseConfigured } from "../services/supabase";
import { useAuth } from "./AuthContext";

// Nursing Station documents, duty shifts and staff profile photos.

interface WardDataContextType {
  carePlans: NursingCarePlan[];
  saveCarePlan: (plan: NursingCarePlan) => Promise<void>;
  doctorOrders: DoctorOrder[];
  saveDoctorOrder: (order: DoctorOrder) => Promise<void>;
  nurseNotes: NurseNote[];
  saveNurseNote: (note: NurseNote) => Promise<void>;
  chiefComplaints: ChiefComplaintEntry[];
  saveChiefComplaint: (entry: ChiefComplaintEntry) => Promise<void>;
  shiftSchedules: ShiftSchedule[];
  saveShiftSchedule: (shift: ShiftSchedule) => Promise<void>;
  removeShiftSchedule: (id: string) => Promise<void>;
  staffPhotos: Record<string, string>;
  saveMyPhoto: (image: string | null) => Promise<void>;
}

const WardDataContext = createContext<WardDataContextType | undefined>(undefined);

const byNewest = <T,>(key: keyof T) => (a: T, b: T) => String(b[key]).localeCompare(String(a[key]));

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const exists = list.some(i => i.id === item.id);
  return exists ? list.map(i => (i.id === item.id ? item : i)) : [item, ...list];
}

export function WardDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [carePlans, setCarePlans] = useState<NursingCarePlan[]>([]);
  const [doctorOrders, setDoctorOrders] = useState<DoctorOrder[]>([]);
  const [nurseNotes, setNurseNotes] = useState<NurseNote[]>([]);
  const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaintEntry[]>([]);
  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule[]>([]);
  const [photoList, setPhotoList] = useState<StaffPhoto[]>([]);

  // Supabase data is only readable once signed in, so reload per account
  useEffect(() => {
    if (!userId && isSupabaseConfigured) return;
    let active = true;
    Promise.all([
      hospitalDb.getAll<NursingCarePlan>("care_plans"),
      hospitalDb.getAll<DoctorOrder>("doctor_orders"),
      hospitalDb.getAll<NurseNote>("nurse_notes"),
      hospitalDb.getAll<ChiefComplaintEntry>("chief_complaints"),
      hospitalDb.getAll<ShiftSchedule>("shift_schedules"),
      hospitalDb.getAll<StaffPhoto>("staff_photos"),
    ])
      .then(([plans, orders, notes, complaints, shifts, photos]) => {
        if (!active) return;
        setCarePlans(plans.sort(byNewest("updatedAt")));
        setDoctorOrders(orders.sort(byNewest("orderedAt")));
        setNurseNotes(notes.sort(byNewest("timestamp")));
        setChiefComplaints(complaints.sort(byNewest("recordedAt")));
        setShiftSchedules(shifts);
        setPhotoList(photos);
      })
      .catch(err => console.warn("Ward data load note:", err));
    return () => {
      active = false;
    };
  }, [userId]);

  const saveCarePlan = useCallback(async (plan: NursingCarePlan) => {
    await hospitalDb.save("care_plans", plan);
    setCarePlans(prev => upsert(prev, plan));
  }, []);

  const saveDoctorOrder = useCallback(async (order: DoctorOrder) => {
    await hospitalDb.save("doctor_orders", order);
    setDoctorOrders(prev => upsert(prev, order));
  }, []);

  const saveNurseNote = useCallback(async (note: NurseNote) => {
    await hospitalDb.save("nurse_notes", note);
    setNurseNotes(prev => upsert(prev, note));
  }, []);

  const saveChiefComplaint = useCallback(async (entry: ChiefComplaintEntry) => {
    await hospitalDb.save("chief_complaints", entry);
    setChiefComplaints(prev => upsert(prev, entry));
  }, []);

  const saveShiftSchedule = useCallback(async (shift: ShiftSchedule) => {
    await hospitalDb.save("shift_schedules", shift);
    setShiftSchedules(prev => upsert(prev, shift));
  }, []);

  const removeShiftSchedule = useCallback(async (id: string) => {
    await hospitalDb.remove("shift_schedules", id);
    setShiftSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  const saveMyPhoto = useCallback(
    async (image: string | null) => {
      if (!userId) return;
      if (image) {
        const photo: StaffPhoto = { id: userId, image, updatedAt: new Date().toISOString() };
        await hospitalDb.save("staff_photos", photo);
        setPhotoList(prev => upsert(prev, photo));
      } else {
        await hospitalDb.remove("staff_photos", userId);
        setPhotoList(prev => prev.filter(p => p.id !== userId));
      }
    },
    [userId]
  );

  const staffPhotos = Object.fromEntries(photoList.map(p => [p.id, p.image]));

  return (
    <WardDataContext.Provider
      value={{
        carePlans,
        saveCarePlan,
        doctorOrders,
        saveDoctorOrder,
        nurseNotes,
        saveNurseNote,
        chiefComplaints,
        saveChiefComplaint,
        shiftSchedules,
        saveShiftSchedule,
        removeShiftSchedule,
        staffPhotos,
        saveMyPhoto,
      }}
    >
      {children}
    </WardDataContext.Provider>
  );
}

export function useWardData(): WardDataContextType {
  const context = useContext(WardDataContext);
  if (!context) {
    throw new Error("useWardData must be used within a WardDataProvider");
  }
  return context;
}
