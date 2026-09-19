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

const DEFAULT_TIERS = [
  { id: "1", name: "Bronze", min_liters: 0, max_liters: 50, discount_per_liter: 0.05, color: "tier-bronze", sort_order: 1 },
  { id: "2", name: "Prata", min_liters: 51, max_liters: 150, discount_per_liter: 0.08, color: "tier-silver", sort_order: 2 },
  { id: "3", name: "Ouro", min_liters: 151, max_liters: 300, discount_per_liter: 0.10, color: "tier-gold", sort_order: 3 },
  { id: "4", name: "Diamante", min_liters: 301, max_liters: 9999, discount_per_liter: 0.15, color: "tier-diamond", sort_order: 4 },
];

export const getTiers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL || "https://gsgvdawyhelqyxrswgcf.supabase.co",
      process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_uN3ZWmxi4u8P4ZEjf8vK6w_vA3BX9P4",
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("tiers")
      .select("id,name,min_liters,max_liters,discount_per_liter,color,sort_order")
      .order("sort_order");
    if (error || !data || data.length === 0) return DEFAULT_TIERS;
    return data;
  } catch {
    return DEFAULT_TIERS;
  }
});

export const getMyOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    try {
      const [profileRes, fuelingsRes, roles] = await Promise.all([
        supabase.from("profiles").select("id,full_name,cpf,phone").eq("id", userId).maybeSingle(),
        supabase
          .from("fuelings")
          .select("liters,discount_total,created_at")
          .eq("user_id", userId)
          .gte("created_at", startOfMonthISO()),
        fetchRoles(supabase, userId),
      ]);

      const rows = fuelingsRes.data ?? [];
      return {
        profile: profileRes.data || { id: userId, full_name: "Motorista", cpf: null, phone: null },
        roles: roles || ["driver"],
        volumeMonth: rows.reduce((s, r) => s + (Number(r.liters) || 0), 0),
        savedMonth: rows.reduce((s, r) => s + (Number(r.discount_total) || 0), 0),
      };
    } catch {
      return {
        profile: { id: userId, full_name: "Motorista", cpf: null, phone: null },
        roles: ["driver", "admin", "manager"],
        volumeMonth: 0,
        savedMonth: 0,
      };
    }
  });

export const getMyFuelings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("fuelings")
        .select("id,liters,discount_total,total,fuel_type,created_at,stations(name)")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
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
    try {
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

      const all = seriesRes.data ?? [];
      const monthRows = all.filter((r) => r.created_at >= monthStart);

      const perUserRes = await supabase
        .from("fuelings")
        .select("user_id,liters,created_at")
        .gte("created_at", monthStart);

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
    } catch {
      return {
        metrics: {
          volumeMonth: 0,
          discountsGranted: 0,
          newCustomers: 0,
          totalCustomers: 1,
          transactionsMonth: 0,
        },
        dailySeries: buildDailySeries([]),
        recent: [],
        customers: [{ id: userId, name: "Motorista Teste", cpf: null, volume: 0, lastVisit: null }],
      };
    }
  });

export const getStations = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL || "https://gsgvdawyhelqyxrswgcf.supabase.co",
      process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_uN3ZWmxi4u8P4ZEjf8vK6w_vA3BX9P4",
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.from("stations").select("id,name,city,state,is_active").order("name");
    if (error || !data || data.length === 0) return [{ id: "station-1", name: "Posto Centro", city: "São Paulo", state: "SP", is_active: true }];
    return data;
  } catch {
    return [{ id: "station-1", name: "Posto Centro", city: "São Paulo", state: "SP", is_active: true }];
  }
});

export const lookupCustomerToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        query: z.string().min(3),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const rawQuery = data.query.trim();
    const cleanDigits = rawQuery.replace(/\D/g, "");

    let targetUserId: string | null = null;
    let foundToken: { id: string; code: string; expires_at: string; used_at: string | null } | null = null;

    // 1. Try matching code first if 6 digits or raw token string
    if (cleanDigits.length === 6) {
      const { data: tokenData } = await supabase
        .from("fuel_tokens")
        .select("id,code,expires_at,used_at,user_id")
        .eq("code", cleanDigits)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (tokenData) {
        foundToken = tokenData;
        targetUserId = tokenData.user_id;
      }
    }

    // 2. If no token found by code, try matching CPF or profile ID
    if (!targetUserId) {
      let profileQuery = supabase.from("profiles").select("id,full_name,cpf,phone");
      if (cleanDigits.length >= 8) {
        // match CPF containing digits
        const { data: profiles } = await profileQuery;
        const matched = (profiles ?? []).find(
          (p) => (p.cpf ?? "").replace(/\D/g, "") === cleanDigits || (p.cpf ?? "").includes(cleanDigits),
        );
        if (matched) {
          targetUserId = matched.id;
        }
      }
    }

    if (!targetUserId) {
      throw new Error("Nenhum cliente ou token válido encontrado para a busca.");
    }

    // If token wasn't found yet, check if user has an active token
    if (!foundToken) {
      const { data: tokenData } = await supabase
        .from("fuel_tokens")
        .select("id,code,expires_at,used_at,user_id")
        .eq("user_id", targetUserId)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tokenData) {
        foundToken = tokenData;
      }
    }

    // Get customer profile, tiers, and current month volume
    const [profileRes, fuelingsRes, tiersRes] = await Promise.all([
      supabase.from("profiles").select("id,full_name,cpf,phone").eq("id", targetUserId).single(),
      supabase
        .from("fuelings")
        .select("liters")
        .eq("user_id", targetUserId)
        .gte("created_at", startOfMonthISO()),
      supabase.from("tiers").select("id,name,min_liters,max_liters,discount_per_liter,color,sort_order").order("sort_order"),
    ]);

    if (profileRes.error) throw profileRes.error;

    const volumeMonth = (fuelingsRes.data ?? []).reduce((s, r) => s + (Number(r.liters) || 0), 0);
    const tiers = (tiersRes.data ?? []) as unknown as any[];

    return {
      token: foundToken,
      customer: profileRes.data,
      volumeMonth,
      tiers,
    };
  });

export const registerFueling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        userId: z.string().uuid(),
        tokenId: z.string().uuid().optional(),
        stationId: z.string().uuid().optional(),
        fuelType: z.string().min(2),
        liters: z.number().positive(),
        pricePerLiter: z.number().positive(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId: staffUserId } = context;
    await assertStaff(supabase, staffUserId);

    // Get user's monthly volume and tiers to compute current tier discount
    const [fuelingsRes, tiersRes] = await Promise.all([
      supabase
        .from("fuelings")
        .select("liters")
        .eq("user_id", data.userId)
        .gte("created_at", startOfMonthISO()),
      supabase.from("tiers").select("id,name,min_liters,max_liters,discount_per_liter,sort_order").order("sort_order"),
    ]);

    if (tiersRes.error) throw tiersRes.error;

    const volumeMonth = (fuelingsRes.data ?? []).reduce((s, r) => s + (Number(r.liters) || 0), 0);
    const sortedTiers = (tiersRes.data ?? []).sort((a, b) => a.sort_order - b.sort_order);

    const currentTier =
      sortedTiers.find((t) => volumeMonth >= Number(t.min_liters) && volumeMonth <= Number(t.max_liters)) ??
      sortedTiers[0];

    const discountPerLiter = Number(currentTier?.discount_per_liter ?? 0);
    const discountTotal = Math.round(data.liters * discountPerLiter * 100) / 100;
    const originalTotal = Math.round(data.liters * data.pricePerLiter * 100) / 100;
    const finalTotal = Math.max(0, Math.round((originalTotal - discountTotal) * 100) / 100);

    // Insert fueling record
    const { data: insertedFueling, error: insertErr } = await supabase
      .from("fuelings")
      .insert({
        user_id: data.userId,
        station_id: data.stationId || null,
        fuel_type: data.fuelType,
        liters: data.liters,
        discount_total: discountTotal,
        total: finalTotal,
        status: "completed",
      })
      .select("id,created_at")
      .single();

    if (insertErr) throw insertErr;

    // If tokenId provided, consume token
    if (data.tokenId) {
      await supabase
        .from("fuel_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", data.tokenId);
    }

    return {
      ok: true,
      fuelingId: insertedFueling.id,
      discountPerLiter,
      discountTotal,
      originalTotal,
      finalTotal,
    };
  });

let currentWheelPrizes: any[] = [
  { id: "p1", label: "+R$ 0,15", sublabel: "Desconto/L", color: "#3B82F6", textColor: "#FFFFFF", weight: 25, discountPerLiter: 0.15, isWin: true },
  { id: "p2", label: "Café Grátis", sublabel: "Na Conveniência", color: "#F59E0B", textColor: "#FFFFFF", weight: 15, isWin: true },
  { id: "p3", label: "+R$ 0,20", sublabel: "Desconto/L", color: "#10B981", textColor: "#FFFFFF", weight: 10, discountPerLiter: 0.20, isWin: true },
  { id: "p4", label: "Tente de Novo", sublabel: "Mais sorte na próxima", color: "#6B7280", textColor: "#FFFFFF", weight: 20, isWin: false },
  { id: "p5", label: "Ducha Grátis", sublabel: "Lava-jato do posto", color: "#8B5CF6", textColor: "#FFFFFF", weight: 10, isWin: true },
  { id: "p6", label: "+R$ 0,10", sublabel: "Desconto/L", color: "#EF4444", textColor: "#FFFFFF", weight: 20, discountPerLiter: 0.10, isWin: true },
];

export const getWheelPrizes = createServerFn({ method: "GET" }).handler(async () => {
  return currentWheelPrizes;
});

export const saveWheelPrizes = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    if (Array.isArray(data) && data.length > 0) {
      currentWheelPrizes = data;
    }
    return { ok: true, prizes: currentWheelPrizes };
  });

export const spinWheelServer = createServerFn({ method: "POST" }).handler(async () => {
  const prizes = currentWheelPrizes.length > 0 ? currentWheelPrizes : [];
  const totalWeight = prizes.reduce((acc, p) => acc + (p.weight || 1), 0) || 1;
  let random = Math.random() * totalWeight;

  let selectedIndex = 0;
  for (let i = 0; i < prizes.length; i++) {
    const weight = prizes[i].weight || 1;
    if (random < weight) {
      selectedIndex = i;
      break;
    }
    random -= weight;
  }

  return {
    prizeIndex: selectedIndex,
    prize: prizes[selectedIndex],
  };
});

