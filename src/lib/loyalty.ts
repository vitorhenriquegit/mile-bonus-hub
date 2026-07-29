// Shared, browser-safe helpers for the loyalty program.

export type Tier = {
  id: string;
  name: string;
  min_liters: number;
  max_liters: number;
  discount_per_liter: number;
  color: string;
  sort_order: number;
};

export const FALLBACK_TIER: Tier = {
  id: "fallback",
  name: "Bronze",
  min_liters: 0,
  max_liters: 50,
  discount_per_liter: 0,
  color: "tier-bronze",
  sort_order: 1,
};

export function tierFor(volume: number, tiers: Tier[]) {
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order);
  if (sorted.length === 0) {
    return { current: FALLBACK_TIER, next: FALLBACK_TIER, isMax: true };
  }
  const idx = sorted.findIndex((t) => volume >= t.min_liters && volume <= t.max_liters);
  const current = sorted[Math.max(0, idx)] ?? sorted[0];
  const next = sorted[Math.min(sorted.length - 1, Math.max(0, idx) + 1)] ?? current;
  return { current, next, isMax: current.name === sorted[sorted.length - 1].name };
}

export function formatBRL(n: number) {
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function maskCpf(cpf?: string | null) {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function relativeDay(iso?: string | null) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias`;
  if (days < 30) return `${Math.floor(days / 7)} semana(s)`;
  return `${Math.floor(days / 30)} mês(es)`;
}