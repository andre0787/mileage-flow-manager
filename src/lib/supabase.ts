import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ohyplfpcwxzakujjfwdf.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("[supabase] Using fallback public Supabase env");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
