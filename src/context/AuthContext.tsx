import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { User, Role } from "../types";
import { DEMO_USERS } from "../mockData";
import { supabase, isSupabaseConfigured } from "../services/supabase";

interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True when sign-in goes through Supabase Auth instead of the demo profiles. */
  isSecureMode: boolean;
  /** False until a stored Supabase session has been checked on page load. */
  isAuthReady: boolean;
  /** Resolves to null on success, or an error message. */
  login: (username: string, password?: string) => Promise<string | null>;
  logout: () => void;
  /** Verifies the current password, then sets the new one. Resolves to null on success, or an error message. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  switchUser: (targetUser: User) => void;
  /** Increments on every successful interactive sign-in (not on session restore). */
  signInCount: number;
  /** Registers work to finish (e.g. writing an audit entry) before the session ends. */
  registerBeforeLogout: (fn: () => Promise<void>) => () => void;
  /** Re-reads the signed-in staff profile (e.g. after an administrator approved changes). */
  refreshProfile: () => Promise<void>;
  /**
   * Asks the auth server whether this sign-in is still valid. If it was ended elsewhere
   * (signed out on another device, password reset, account removed) the user is signed
   * out here and `sessionNotice` explains why. Resolves to false in that case.
   */
  verifySession: () => Promise<boolean>;
  /** Why the user was signed out automatically, shown on the sign-in form. */
  sessionNotice: string | null;
  dismissSessionNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "carepoint_opd_auth_session";

// Resolves the CarePoint staff profile linked to a Supabase Auth login via
// public.staff_accounts. Returns null if the login is not linked to any staff.
async function loadStaffProfile(authId: string): Promise<User | null> {
  const { data: link, error } = await supabase!
    .from("staff_accounts")
    .select("user_id")
    .eq("auth_id", authId)
    .maybeSingle();
  if (error || !link) return null;

  const { data: row } = await supabase!
    .from("users")
    .select("data")
    .eq("id", link.user_id)
    .maybeSingle();
  return (row?.data as User | undefined) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Supabase restores its own session in the effect below
    if (isSupabaseConfigured) return null;
    // Try to restore session from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          return session.user;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to parse stored auth session", e);
    }
    // Start unauthenticated so login page or public pages display first
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (isSupabaseConfigured) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          return session.token;
        }
      }
    } catch {
      // fallback
    }
    return null;
  });

  // Save or clear session in localStorage whenever user/token changes
  const saveSession = (newUser: User | null, newToken: string | null) => {
    if (newUser && newToken) {
      const session: AuthSession = {
        token: newToken,
        user: newUser,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);
  const [signInCount, setSignInCount] = useState(0);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const dismissSessionNotice = useCallback(() => setSessionNotice(null), []);
  // True while this tab is signing out on purpose, so SIGNED_OUT is not reported as an expired session
  const signingOut = useRef(false);
  const lastVerified = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;

  const SESSION_ENDED =
    "Your session has ended because this account was signed out on another device or its password was changed. Please sign in again.";

  const verifySession = useCallback(async (): Promise<boolean> => {
    if (!supabase) return true;
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;
    lastVerified.current = Date.now();
    // getUser() checks the session with the auth server; getSession() only reads local storage
    const { error } = await supabase.auth.getUser();
    if (!error) return true;
    // The session was revoked ("Auth session missing"), or the token / user is no longer accepted.
    // Anything else (offline, server trouble) keeps the user signed in until the next check.
    const ended = error.name === "AuthSessionMissingError" || error.status === 401 || error.status === 403;
    if (!ended) return true;
    signingOut.current = true;
    await supabase.auth.signOut({ scope: "local" }).catch(console.error);
    signingOut.current = false;
    setUser(null);
    setToken(null);
    setSessionNotice(SESSION_ENDED);
    return false;
  }, []);

  // Keep React state in sync with the Supabase Auth session
  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const applySession = async (authId: string | null, accessToken: string | null) => {
      const profile = authId ? await loadStaffProfile(authId) : null;
      if (!active) return;
      setUser(profile);
      setToken(profile ? accessToken : null);
      setIsAuthReady(true);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      // A stored session may have been ended elsewhere since this tab last ran; check before restoring it
      if (data.session && !(await verifySession())) {
        if (active) setIsAuthReady(true);
        return;
      }
      applySession(data.session?.user.id ?? null, data.session?.access_token ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Signed out without pressing Log Out here (e.g. the refresh token was revoked)
        if (userRef.current && !signingOut.current) setSessionNotice(SESSION_ENDED);
        setUser(null);
        setToken(null);
      } else if (event === "TOKEN_REFRESHED") {
        setToken(session?.access_token ?? null);
      }
    });

    // Re-check when staff come back to the tab, at most once a minute
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastVerified.current > 60_000) verifySession();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [verifySession]);

  const loginWithSupabase = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase!.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session) {
      return "Invalid email or password.";
    }

    const profile = await loadStaffProfile(data.session.user.id);
    if (!profile) {
      await supabase!.auth.signOut({ scope: "local" });
      return "This account is not linked to a CarePoint staff profile. Contact the system administrator.";
    }
    if (profile.status && profile.status !== "active") {
      await supabase!.auth.signOut({ scope: "local" });
      return "This staff account is suspended or inactive.";
    }

    setUser(profile);
    setToken(data.session.access_token);
    setSessionNotice(null);
    lastVerified.current = Date.now();
    setSignInCount(c => c + 1);
    return null;
  };

  const login = async (username: string, password = "pass"): Promise<string | null> => {
    if (supabase) return loginWithSupabase(username, password);
    return loginDemo(username) ? null : "Invalid credentials. Please select one of the authorized staff demo profiles below or verify your clinician username.";
  };

  const loginDemo = (username: string): boolean => {
    const key = username.toLowerCase().trim();
    const matched = Object.values(DEMO_USERS).find(
      u =>
        u.user.username?.toLowerCase() === key ||
        u.user.id.toLowerCase() === key ||
        u.user.name.toLowerCase().includes(key)
    );

    if (matched) {
      const generatedToken = `jwt-mock-${matched.user.id}-${btoa(matched.user.name)}-${Date.now()}`;
      setUser(matched.user);
      setToken(generatedToken);
      saveSession(matched.user, generatedToken);
      setSignInCount(c => c + 1);
      return true;
    }

    // Also check dynamic registered users in persistent store
    try {
      const storedUsers = localStorage.getItem("carepoint_users");
      if (storedUsers) {
        const parsed: User[] = JSON.parse(storedUsers);
        const dynamicMatched = parsed.find(
          u =>
            u.username?.toLowerCase() === key ||
            u.id.toLowerCase() === key ||
            u.name.toLowerCase().includes(key)
        );
        if (dynamicMatched) {
          const generatedToken = `jwt-mock-${dynamicMatched.id}-${btoa(dynamicMatched.name)}-${Date.now()}`;
          setUser(dynamicMatched);
          setToken(generatedToken);
          saveSession(dynamicMatched, generatedToken);
          setSignInCount(c => c + 1);
          return true;
        }
      }
    } catch {
      // ignore
    }

    return false;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<string | null> => {
    if (!supabase) {
      return "Password changes are only available when the system is connected to the hospital database.";
    }
    if (newPassword.length < 8) return "New password must be at least 8 characters.";
    if (newPassword === currentPassword) return "New password must be different from your current password.";

    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email) return "Your session has expired. Please sign in again.";

    // Re-authenticate to confirm the current password before changing it
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (verifyError) return "Current password is incorrect.";

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return error.message;
    return null;
  };

  const beforeLogout = useRef(new Set<() => Promise<void>>());
  const registerBeforeLogout = useCallback((fn: () => Promise<void>) => {
    beforeLogout.current.add(fn);
    return () => {
      beforeLogout.current.delete(fn);
    };
  }, []);

  const logout = async () => {
    // Let listeners (audit log) finish while the session is still valid, but never hang sign-out
    const pending = Promise.all([...beforeLogout.current].map(fn => fn().catch(console.error)));
    await Promise.race([pending, new Promise(resolve => setTimeout(resolve, 2000))]);
    // Only end this browser's session; other devices signed in to the same account stay signed in
    signingOut.current = true;
    if (supabase) await supabase.auth.signOut({ scope: "local" }).catch(console.error);
    signingOut.current = false;
    setUser(null);
    setToken(null);
    saveSession(null, null);
  };

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const authId = data.session?.user.id;
    if (!authId) return;
    const profile = await loadStaffProfile(authId);
    if (profile) setUser(profile);
  }, []);

  const switchUser = (targetUser: User) => {
    // Identity comes from the signed-in Supabase account; no impersonation.
    if (isSupabaseConfigured) return;
    const newToken = `jwt-mock-${targetUser.id}-${btoa(targetUser.name)}-${Date.now()}`;
    setUser(targetUser);
    setToken(newToken);
    saveSession(targetUser, newToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        token,
        isAuthenticated: !!user,
        isSecureMode: isSupabaseConfigured,
        isAuthReady,
        login,
        logout,
        changePassword,
        switchUser,
        signInCount,
        registerBeforeLogout,
        refreshProfile,
        verifySession,
        sessionNotice,
        dismissSessionNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
