import { useCallback, useEffect, useState } from "react";
import { hospitalDb } from "../services/db";
import { useOpdData } from "../context/OpdDataContext";

/**
 * Loads one table (e.g. "bills") for a page and saves changes to it.
 * Every save is written to the audit log with the given action text.
 */
export function useCollection<T extends { id: string }>(store: string) {
  const { logAction } = useOpdData();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await hospitalDb.getAll<T>(store));
      setError(null);
    } catch {
      setError("Could not load the records. Check your connection and refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Saves the record; resolves to null on success or an error message. */
  const save = useCallback(
    async (item: T, action: string, patient?: { patientId?: string; patientName?: string }): Promise<string | null> => {
      try {
        await hospitalDb.save(store, item);
      } catch (err) {
        const msg = (err as { message?: string })?.message || "";
        return msg.includes("row-level security") ? "Your account is not allowed to make this change." : `Could not save: ${msg || "please try again."}`;
      }
      setItems(prev => (prev.some(i => i.id === item.id) ? prev.map(i => (i.id === item.id ? item : i)) : [item, ...prev]));
      logAction(action, patient);
      return null;
    },
    [store, logAction]
  );

  /** Inserts a new record only (never overwrites); for records a role may create but not edit. */
  const add = useCallback(
    async (item: T, action: string, patient?: { patientId?: string; patientName?: string }): Promise<string | null> => {
      try {
        await hospitalDb.append(store, item);
      } catch (err) {
        const msg = (err as { message?: string })?.message || "";
        return msg.includes("row-level security") ? "Your account is not allowed to add this record." : `Could not save: ${msg || "please try again."}`;
      }
      setItems(prev => [item, ...prev]);
      logAction(action, patient);
      return null;
    },
    [store, logAction]
  );

  return { items, loading, error, reload, save, add };
}
