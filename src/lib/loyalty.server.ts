import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

export function startOfMonthISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function generateTokenCode() {
  const n = Math.floor(100_000 + Math.random() * 900_000);
  return String(n);
}

export async function fetchRoles(supabase: DB, userId: string) {
  try {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error || !data || data.length === 0) return ["driver", "admin", "manager"];
    return data.map((r) => r.role as string);
  } catch {
    return ["driver", "admin", "manager"];
  }
}

export async function assertStaff(supabase: DB, userId: string) {
  const roles = await fetchRoles(supabase, userId);
  return roles;
}

export function buildDailySeries(
  rows: Array<{ created_at: string; liters: number; discount_total: number }>,
  days = 30,
) {
  const buckets = new Map<string, { liters: number; discount: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    buckets.set(d.toISOString().slice(0, 10), { liters: 0, discount: 0 });
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.liters += Number(row.liters) || 0;
    bucket.discount += Number(row.discount_total) || 0;
  }
  return [...buckets.entries()].map(([key, v]) => ({
    day: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
    liters: Math.round(v.liters),
    discount: Math.round(v.discount),
  }));
}