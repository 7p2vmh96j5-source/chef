import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError = !url || !key
  ? "Supabase är inte konfigurerat. Kontrollera .env.local."
  : null;

export const supabase = supabaseConfigError ? null : createClient(url, key);
