import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient>;

export function getSupabase(url: string, key: string) {
  if (!supabase) {
    supabase = createClient(
        url,
        key
    );
  }
  return supabase;
}