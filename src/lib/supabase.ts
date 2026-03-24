import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const supabase: SupabaseClient | null =
  supabaseUrl.length > 0 && supabaseKey.length > 0
    ? createClient(supabaseUrl, supabaseKey)
    : null;
