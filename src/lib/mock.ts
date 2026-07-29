// Mock data shared by app + dashboard

export type Tier = {
  name: string;
  min: number;
  max: number;
  discount: number; // R$ per liter
  color: string;
};

export const TIERS: Tier[] = [
  { name: "Bronze", min: 0, max: 50, discount: 0.05, color: "tier-bronze" },
  { name: "Prata", min: 51, max: 150, discount: 0.08, color: "tier-silver" },
  { name: "Ouro", min: 151, max: 300, discount: 0.10, color: "tier-gold" },
  { name: "Diamante", min: 301, max: 9999, discount: 0.15, color: "tier-diamond" },
];

export const CURRENT_USER = {
  name: "Lucas",
  cpf: "***.456.789-**",
  volumeMonth: 165, // liters
};

export function tierFor(volume: number) {
  const idx = TIERS.findIndex((t) => volume >= t.min && volume <= t.max);
  const current = TIERS[Math.max(0, idx)];
  const next = TIERS[Math.min(TIERS.length - 1, idx + 1)] ?? current;
  return { current, next, isMax: current.name === TIERS[TIERS.length - 1].name };
}

export const HISTORY = [
  { id: "1", date: "12 Nov 2024", liters: 38.2, saved: 3.06, station: "Posto Centro" },
  { id: "2", date: "04 Nov 2024", liters: 42.5, saved: 3.40, station: "Posto Centro" },
  { id: "3", date: "27 Out 2024", liters: 35.0, saved: 2.80, station: "Posto Av. Brasil" },
  { id: "4", date: "18 Out 2024", liters: 49.3, saved: 3.94, station: "Posto Centro" },
  { id: "5", date: "09 Out 2024", liters: 28.1, saved: 1.40, station: "Posto Centro" },
];

// Dashboard mock — realistic fuel sector data
export const DASHBOARD_METRICS = {
  volumeMonth: 142_500,
  volumeDelta: 5.0,
  discountsGranted: 12_350.0,
  discountsDelta: 7.8,
  newCustomers: 342,
  newCustomersDelta: 18.2,
  churnRisk: 12,
  churnDelta: 2.4,
};

export const DAILY_SERIES = Array.from({ length: 30 }).map((_, i) => {
  const base = 3800 + Math.sin(i / 3) * 600 + (i % 7 === 5 || i % 7 === 6 ? 1400 : 0);
  const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 220;
  const liters = Math.round(base + noise + i * 25);
  const discount = Math.round(liters * (0.085 + Math.sin(i / 4) * 0.012));
  return { day: `${String(i + 1).padStart(2, "0")}/11`, liters, discount };
});

export const LIVE_TRANSACTIONS = [
  { id: "tx-9821", time: "14:32:11", status: "ok", cpf: "***.456.789-**", fuel: "Gasolina Aditivada", liters: 42.8, discount: 4.28, total: 248.36, station: "Posto Centro" },
  { id: "tx-9820", time: "14:31:48", status: "ok", cpf: "***.123.456-**", fuel: "Etanol", liters: 38.2, discount: 3.06, total: 156.40, station: "Posto Av. Brasil" },
  { id: "tx-9819", time: "14:30:22", status: "ok", cpf: "***.987.321-**", fuel: "Diesel S10", liters: 120.5, discount: 18.07, total: 712.95, station: "Posto Rodovia" },
  { id: "tx-9818", time: "14:29:05", status: "fail", cpf: "***.654.987-**", fuel: "Gasolina Comum", liters: 0, discount: 0, total: 0, station: "Posto Centro" },
  { id: "tx-9817", time: "14:28:51", status: "ok", cpf: "***.321.654-**", fuel: "Gasolina Aditivada", liters: 55.0, discount: 5.50, total: 319.50, station: "Posto Centro" },
  { id: "tx-9816", time: "14:27:39", status: "ok", cpf: "***.789.123-**", fuel: "Diesel S10", liters: 89.3, discount: 13.40, total: 528.20, station: "Posto Av. Brasil" },
  { id: "tx-9815", time: "14:26:14", status: "ok", cpf: "***.456.123-**", fuel: "Etanol", liters: 31.7, discount: 2.54, total: 129.80, station: "Posto Rodovia" },
  { id: "tx-9814", time: "14:25:02", status: "ok", cpf: "***.852.741-**", fuel: "Gasolina Comum", liters: 47.2, discount: 3.78, total: 273.76, station: "Posto Centro" },
];

export const CUSTOMERS = [
  { id: "u1", name: "Lucas Almeida", cpf: "123.456.789-00", volume: 165, tier: "Ouro", lastVisit: "Hoje" },
  { id: "u2", name: "Mariana Costa", cpf: "987.654.321-00", volume: 312, tier: "Diamante", lastVisit: "Ontem" },
  { id: "u3", name: "Rafael Souza", cpf: "456.789.123-00", volume: 78, tier: "Prata", lastVisit: "3 dias" },
  { id: "u4", name: "Juliana Pereira", cpf: "321.654.987-00", volume: 42, tier: "Bronze", lastVisit: "5 dias" },
  { id: "u5", name: "Bruno Lima", cpf: "654.321.987-00", volume: 198, tier: "Ouro", lastVisit: "1 semana" },
  { id: "u6", name: "Camila Rocha", cpf: "789.123.456-00", volume: 256, tier: "Ouro", lastVisit: "2 dias" },
];

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
