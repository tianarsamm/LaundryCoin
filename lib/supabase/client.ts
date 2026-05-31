// lib/supabase/client.ts
// SATU instance untuk seluruh aplikasi — tidak boleh createClient() di tempat lain

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

// Alias default untuk kemudahan import
export const supabase = getSupabaseClient();