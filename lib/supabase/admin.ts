import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily-initialized service-role client.
// Created on first call so it never throws at module evaluation time
// when env vars are absent (e.g. during static build page collection).
// Only used server-side in the webhook handler.
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _client;
}
