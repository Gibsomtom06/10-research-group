import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function browserClient() {
  if (!url || !anonKey) throw new Error("Supabase public env not set");
  return createClient(url, anonKey);
}

export function serverClient() {
  if (!url || !serviceKey) throw new Error("Supabase service env not set");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
