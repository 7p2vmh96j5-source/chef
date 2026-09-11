import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const REMEMBER_LOGIN_KEY = "koket:remember-login";

const authStorage = {
  getItem(keyName) {
    const storage = localStorage.getItem(REMEMBER_LOGIN_KEY) === "true" ? localStorage : sessionStorage;
    return storage.getItem(keyName);
  },
  setItem(keyName, value) {
    const remember = localStorage.getItem(REMEMBER_LOGIN_KEY) === "true";
    (remember ? localStorage : sessionStorage).setItem(keyName, value);
    (remember ? sessionStorage : localStorage).removeItem(keyName);
  },
  removeItem(keyName) {
    localStorage.removeItem(keyName);
    sessionStorage.removeItem(keyName);
  },
};

export const supabaseConfigError = !url || !key
  ? "Supabase är inte konfigurerat. Kontrollera .env.local."
  : null;

export const supabase = supabaseConfigError ? null : createClient(url, key, {
  auth: {
    storage: authStorage,
  },
});
