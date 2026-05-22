// Klient i Supabase per server-side (perdor service_role key)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  // Mos kraso aplikacionin nese jane bosh - bej upload optional
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL ose SUPABASE_SERVICE_ROLE_KEY mungojne. Upload-i i fotove nuk do te funksionoje."
  );
}

export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export const RECEIPTS_BUCKET = "receipts";

export function isSupabaseConfigured() {
  return supabaseAdmin !== null;
}
