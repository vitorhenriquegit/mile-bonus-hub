import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  assertStaff,
  buildDailySeries,
  daysAgoISO,
  fetchRoles,
  generateTokenCode,
  startOfMonthISO,
} from "./loyalty.server";

export const getTiers = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase
    .from("tiers")
    .select("id,name,min_liters,max_liters,discount_per_liter,color,sort_order")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
});

export const getMyOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, fuelingsRes, roles] = await Promise.all([
      supabase.from("profiles").select("id,full_name,cpf,phone").eq("id", userId).maybeSingle(),
      supabase
        .from("fuelings")
        .select("liters,discount_total,created_at")
        .eq("user_id", userId)
        .gte("created_at", startOfMonthISO()),
      fetchRoles(supabase, userId),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (fuelingsRes.error) throw fuelingsRes.error;

    const rows = fuelingsRes.data ?? [];
    return {
      profile: profileRes.data,
      roles,
      volumeMonth: rows.reduce((s, r) => s + (Number(r.liters) || 0), 0),
      savedMonth: rows.reduce((s, r) => s + (Number(r.discount_total) || 0), 0),
    };
  });

export const getMyFuelings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fuelings")
      .select("id,liters,discount_total,total,fuel_type,created_at,stations(name)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

export const getMyActiveToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fuel_tokens")
      .select("id,code,expires_at,used_at")
      .eq("user_id", context.userId)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const createFuelToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fuel_tokens")
      .insert({
        user_id: context.userId,
        code: generateTokenCode(),
        expires_at: new Date(Date.now() + 120_000).toISOString(),
      })
      .select("id,code,expires_at,used_at")
      .single();
    if (error) throw error;
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        full_name: z.string().min(2).max(120),
        cpf: z.string().max(20).optional(),
        phone: z.string().max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const updateTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        min_liters: z.number().min(0),
        max_liters: z.number().min(0),
        discount_per_liter: z.number().min(0).max(10),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("tiers").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const monthStart = startOfMonthISO();
    const [seriesRes, recentRes, profilesRes] = await Promise.all([
      supabase
        .from("fuelings")
        .select("created_at,liters,discount_total")
        .gte("created_at", daysAgoISO(30)),
      supabase
        .from("fuelings")
        .select("id,created_at,fuel_type,liters,discount_total,total,status,user_id,stations(name)")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("profiles").select("id,full_name,cpf,created_at"),
    ]);
    if (seriesRes.error) throw seriesRes.error;
    if (recentRes.error) throw recentRes.error;
    if (profilesRes.error) throw profilesRes.error;

    const all = seriesRes.data ?? [];
    const monthRows = all.filter((r) => r.created_at >= monthStart);

    const perUserRes = await supabase
      .from("fuelings")
      .select("user_id,liters,created_at")
      .gte("created_at", monthStart);
    if (perUserRes.error) throw perUserRes.error;

    const profileById = new Map(
      (profilesRes.data ?? []).map((p) => [p.id, { full_name: p.full_name, cpf: p.cpf }]),
    );

    const perUser = new Map<string, { volume: number; last: string }>();
    for (const row of perUserRes.data ?? []) {
      const entry = perUser.get(row.user_id) ?? { volume: 0, last: row.created_at };
      entry.volume += Number(row.liters) || 0;
      if (row.created_at > entry.last) entry.last = row.created_at;
      perUser.set(row.user_id, entry);
    }

    return {
      metrics: {
        volumeMonth: monthRows.reduce((s, r) => s + (Number(r.liters) || 0), 0),
        discountsGranted: monthRows.reduce((s, r) => s + (Number(r.discount_total) || 0), 0),
        newCustomers: (profilesRes.data ?? []).filter((p) => p.created_at >= monthStart).length,
        totalCustomers: (profilesRes.data ?? []).length,
        transactionsMonth: monthRows.length,
      },
      dailySeries: buildDailySeries(all),
      recent: (recentRes.data ?? []).map((tx) => ({
        ...tx,
        customerName: profileById.get(tx.user_id)?.full_name ?? null,
        customerCpf: profileById.get(tx.user_id)?.cpf ?? null,
      })),
      customers: (profilesRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.full_name || "Sem nome",
        cpf: p.cpf,
        volume: perUser.get(p.id)?.volume ?? 0,
        lastVisit: perUser.get(p.id)?.last ?? null,
      })),
    };
  });