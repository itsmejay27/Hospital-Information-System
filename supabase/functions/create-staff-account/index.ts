// ==============================================================================
// CarePoint Medical Center — create-staff-account (Supabase Edge Function)
// Lets a signed-in, active administrator create a staff login: it creates the
// Supabase Auth user, the staff profile (public.users) and the link between them
// (public.staff_accounts). Uses the service role key, which never leaves the server.
// ==============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROLES = ["doctor", "nurse", "staff", "admin"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // 1. Identify the caller and confirm they are an active administrator
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json({ error: "Not signed in." }, 401);

  const { data: link } = await admin
    .from("staff_accounts")
    .select("user_id")
    .eq("auth_id", caller.user.id)
    .maybeSingle();
  const { data: callerProfile } = link
    ? await admin.from("users").select("data").eq("id", link.user_id).maybeSingle()
    : { data: null };
  const callerData = callerProfile?.data as { role?: string; status?: string } | undefined;
  if (callerData?.role !== "admin" || (callerData.status ?? "active") !== "active") {
    return json({ error: "Only an active administrator can create accounts." }, 403);
  }

  // 2. Validate the request
  let body: { email?: string; password?: string; profile?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const profile = body.profile ?? {};
  const id = String(profile.id ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
  if (!id || !String(profile.name ?? "").trim()) return json({ error: "Name is required." }, 400);
  if (!ROLES.includes(String(profile.role))) return json({ error: "Invalid role." }, 400);

  const { data: existing } = await admin.from("users").select("id").eq("id", id).maybeSingle();
  if (existing) return json({ error: "A staff profile with this ID already exists." }, 409);

  // 3. Create the login, then the profile and link; undo the login if either fails
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return json({ error: createError?.message ?? "Could not create the login." }, 400);
  }

  const newProfile = { ...profile, id, status: "active", contactEmail: email };
  const { error: profileError } = await admin
    .from("users")
    .insert({ id, data: newProfile, updated_at: new Date().toISOString() });
  const { error: linkError } = profileError
    ? { error: profileError }
    : await admin.from("staff_accounts").insert({ auth_id: created.user.id, user_id: id });

  if (profileError || linkError) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (!profileError) await admin.from("users").delete().eq("id", id);
    return json({ error: "Could not save the staff profile." }, 500);
  }

  return json({ profile: newProfile });
});
