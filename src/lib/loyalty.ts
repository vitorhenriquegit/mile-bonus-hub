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

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(";"), ...rows.map((e) => e.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export type WheelPrize = {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  textColor: string;
  weight: number;
  discountPerLiter?: number;
  isWin: boolean;
};

export const DEFAULT_WHEEL_PRIZES: WheelPrize[] = [
  { id: "p1", label: "+R$ 0,15", sublabel: "Desconto/L", color: "#3B82F6", textColor: "#FFFFFF", weight: 25, discountPerLiter: 0.15, isWin: true },
  { id: "p2", label: "Café Grátis", sublabel: "Na Conveniência", color: "#F59E0B", textColor: "#FFFFFF", weight: 15, isWin: true },
  { id: "p3", label: "+R$ 0,20", sublabel: "Desconto/L", color: "#10B981", textColor: "#FFFFFF", weight: 10, discountPerLiter: 0.20, isWin: true },
  { id: "p4", label: "Tente de Novo", sublabel: "Mais sorte na próxima", color: "#6B7280", textColor: "#FFFFFF", weight: 20, isWin: false },
  { id: "p5", label: "Ducha Grátis", sublabel: "Lava-jato do posto", color: "#8B5CF6", textColor: "#FFFFFF", weight: 10, isWin: true },
  { id: "p6", label: "+R$ 0,10", sublabel: "Desconto/L", color: "#EF4444", textColor: "#FFFFFF", weight: 20, discountPerLiter: 0.10, isWin: true },
];

export type Campaign = {
  id: string;
  title: string;
  description: string;
  status: "active" | "scheduled" | "paused" | "expired";
  discountType: "per_liter" | "percentage";
  discountValue: number; // ex: 0.25 para R$ 0,25/L ou 5 para 5%
  minFuelAmount: number; // ex: R$ 100
  fuelTypes: string[]; // ex: ["gasolina_comum", "gasolina_aditivada", "etanol", "diesel_s10"]
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  channels: {
    push: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  messageTitle: string;
  messageBody: string;
  targetAudience: "all" | "frequent" | "inactive" | "gold_diamond";
  metrics: {
    messagesSent: number;
    fuelingsCount: number;
    totalLiters: number;
    totalDiscountBrl: number;
  };
  createdAt: string;
};

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    title: "Super Quarta do Combustível",
    description: "Desconto turbinado de R$ 0,25/litro em qualquer abastecimento acima de R$ 120,00 toda quarta-feira.",
    status: "active",
    discountType: "per_liter",
    discountValue: 0.25,
    minFuelAmount: 120,
    fuelTypes: ["gasolina_comum", "gasolina_aditivada", "etanol"],
    daysOfWeek: [3], // Quarta-feira
    startDate: "2026-03-01",
    endDate: "2026-12-31",
    channels: {
      push: true,
      whatsapp: true,
      sms: false,
    },
    messageTitle: "⚡ Super Quarta FuelRewards: Economize R$ 0,25/L!",
    messageBody: "Olá, {cliente}! Hoje é Super Quarta! Abasteça acima de R$ {minimo} e garanta R$ {desconto}/L de desconto imediato. Apresente seu app e aproveite!",
    targetAudience: "all",
    metrics: {
      messagesSent: 1420,
      fuelingsCount: 386,
      totalLiters: 15440,
      totalDiscountBrl: 3860,
    },
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "camp-2",
    title: "Fim de Semana Premiado 150+",
    description: "Sábado e Domingo com +R$ 0,20/litro para tanques cheios ou abastecimentos a partir de R$ 150.",
    status: "active",
    discountType: "per_liter",
    discountValue: 0.20,
    minFuelAmount: 150,
    fuelTypes: ["gasolina_comum", "gasolina_aditivada", "diesel_s10"],
    daysOfWeek: [0, 6], // Domingo e Sábado
    startDate: "2026-03-15",
    endDate: "2026-06-30",
    channels: {
      push: true,
      whatsapp: true,
      sms: true,
    },
    messageTitle: "🚗 Fim de Semana Premiado: Tanque Cheio com Desconto!",
    messageBody: "Partiu pegar a estrada? Abastecendo acima de R$ {minimo} neste fim de semana você ganha R$ {desconto}/L de desconto!",
    targetAudience: "frequent",
    metrics: {
      messagesSent: 2150,
      fuelingsCount: 520,
      totalLiters: 23400,
      totalDiscountBrl: 4680,
    },
    createdAt: "2026-03-15T08:00:00Z",
  },
  {
    id: "camp-3",
    title: "Festival do Etanol Limpo",
    description: "Incentivo ecológico de terça a quinta com 5% de desconto extra no Etanol Hidratado.",
    status: "paused",
    discountType: "percentage",
    discountValue: 5,
    minFuelAmount: 80,
    fuelTypes: ["etanol"],
    daysOfWeek: [2, 3, 4], // Terça, Quarta, Quinta
    startDate: "2026-04-01",
    endDate: "2026-05-31",
    channels: {
      push: true,
      whatsapp: false,
      sms: false,
    },
    messageTitle: "🌱 Semana do Etanol: Economia Verde para Você!",
    messageBody: "Olá {cliente}, abasteça com Etanol acima de R$ {minimo} e ganhe 5% de bônus imediato no seu abastecimento!",
    targetAudience: "all",
    metrics: {
      messagesSent: 890,
      fuelingsCount: 142,
      totalLiters: 5680,
      totalDiscountBrl: 1136,
    },
    createdAt: "2026-03-20T14:30:00Z",
  },
];
