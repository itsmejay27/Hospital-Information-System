// ==============================================================================
// CarePoint Medical Center — Supabase Cloud Client
// Configured through VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. When either is
// missing, `supabase` is null and the app runs on the local IndexedDB store only.
// ==============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;
