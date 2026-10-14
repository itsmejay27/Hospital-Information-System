/**
 * Unsaved consultation (SOAP) notes, kept per doctor and patient so typing survives moving to
 * another page. Stored in sessionStorage: it lasts for this browser tab only and is cleared on
 * sign-out, so notes are not left behind on a shared computer.
 */
const PREFIX = "carepoint.soapDraft.";

const key = (userId: string, patientId: string) => `${PREFIX}${userId}.${patientId}`;

export function loadSoapDraft<T>(userId: string, patientId: string): T | null {
  try {
    const raw = sessionStorage.getItem(key(userId, patientId));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveSoapDraft<T>(userId: string, patientId: string, draft: T): void {
  try {
    sessionStorage.setItem(key(userId, patientId), JSON.stringify(draft));
  } catch {
    // Storage full or unavailable: the draft only lives on screen
  }
}

export function clearSoapDraft(userId: string, patientId: string): void {
  try {
    sessionStorage.removeItem(key(userId, patientId));
  } catch {
    // ignore
  }
}

/** Removes every saved draft (on sign-out). */
export function clearAllSoapDrafts(): void {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}
