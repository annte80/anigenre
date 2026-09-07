import { createClient } from "@supabase/supabase-js";
import type { AnigenreEntity, AnigenreConfig } from "@/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchEntities(): Promise<AnigenreEntity[]> {
  const { data, error } = await supabase
    .from("anigenre_entities")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AnigenreEntity[];
}

export async function fetchConfig(): Promise<AnigenreConfig | null> {
  const { data, error } = await supabase
    .from("anigenre_config")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as AnigenreConfig | null;
}
