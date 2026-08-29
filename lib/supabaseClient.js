import { createClient } from "@supabase/supabase-js";

// Dipakai di client-side (form publik) — cuma bisa insert karena RLS
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Dipakai di server-side (API routes) — full access, bypass RLS
// JANGAN pernah import ini di komponen client!
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
