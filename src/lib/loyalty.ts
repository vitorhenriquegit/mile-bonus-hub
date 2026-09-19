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
  { id: "p1", label: "+R$ 0,15", sublabel: "Desconto / L", color: "#2563EB", textColor: "#FFFFFF", weight: 25, discountPerLiter: 0.15, isWin: true },
  { id: "p2", label: "Café Grátis", sublabel: "Na Conveniência", color: "#D97706", textColor: "#FFFFFF", weight: 15, isWin: true },
  { id: "p3", label: "+R$ 0,20", sublabel: "Super Bônus / L", color: "#059669", textColor: "#FFFFFF", weight: 10, discountPerLiter: 0.20, isWin: true },
  { id: "p4", label: "Tente de Novo", sublabel: "Mais sorte amanhã", color: "#475569", textColor: "#FFFFFF", weight: 20, isWin: false },
  { id: "p5", label: "Ducha Grátis", sublabel: "Lava-jato do Posto", color: "#7C3AED", textColor: "#FFFFFF", weight: 10, isWin: true },
  { id: "p6", label: "+R$ 0,10", sublabel: "Desconto / L", color: "#DC2626", textColor: "#FFFFFF", weight: 20, discountPerLiter: 0.10, isWin: true },
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

export type FraudSeverity = "low" | "medium" | "high" | "critical";

export type FraudIncident = {
  id: string;
  ruleCode: "same_customer_high_frequency" | "volume_exceeds_tank" | "attendant_discount_anomaly" | "split_transactions" | "off_hours_spike" | "fuel_mismatch";
  ruleName: string;
  severity: FraudSeverity;
  status: "pending" | "investigating" | "confirmed_fraud" | "false_positive";
  attendantId: string;
  attendantName: string;
  customerName: string;
  customerCpf: string;
  stationName: string;
  pumpNumber: number;
  occurredAt: string;
  description: string;
  evidence: {
    transactionCount?: number;
    timeWindowMinutes?: number;
    totalLiters?: number;
    fuelType?: string;
    anomalyRate?: string;
    discountTotalBrl?: number;
  };
};

export type AttendantSecurityProfile = {
  id: string;
  name: string;
  code: string; // Matrícula
  shift: "Manhã" | "Tarde" | "Noite";
  status: "active" | "under_review" | "suspended";
  riskScore: number; // 0 a 100
  riskLevel: FraudSeverity;
  totalTransactionsMonth: number;
  discountTransactionsRate: number; // ex: 68%
  storeAverageDiscountRate: number; // ex: 32%
  openIncidentsCount: number;
  confirmedFraudsCount: number;
  avatarUrl?: string;
};

export type SecurityRuleSetting = {
  id: string;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: FraudSeverity;
  thresholdValue: number;
  thresholdUnit: string;
};

export const DEFAULT_SECURITY_RULES: SecurityRuleSetting[] = [
  {
    id: "r1",
    code: "same_customer_high_frequency",
    name: "Mesmo CPF Abastecendo Acima da Média",
    description: "Detecta quando o mesmo cliente registra abastecimento mais de N vezes no mesmo dia ou com intervalo curto (suspeita de frentista pontuando em abastecimento de terceiros).",
    enabled: true,
    severity: "critical",
    thresholdValue: 2,
    thresholdUnit: "abastecimentos/dia",
  },
  {
    id: "r2",
    code: "volume_exceeds_tank",
    name: "Volume Acima da Capacidade do Tanque",
    description: "Alerta transações únicas com litragem improvável para veículos leves sem justificativa de frota.",
    enabled: true,
    severity: "high",
    thresholdValue: 80,
    thresholdUnit: "litros em 1 abastecimento",
  },
  {
    id: "r3",
    code: "attendant_discount_anomaly",
    name: "Concentração Anormal de Descontos por Frentista",
    description: "Identifica frentistas cuja taxa de concessão de descontos e pontos excede a média dos colegas de turno.",
    enabled: true,
    severity: "high",
    thresholdValue: 40,
    thresholdUnit: "% acima da média da equipe",
  },
  {
    id: "r4",
    code: "split_transactions",
    name: "Fracionamento de Abastecimentos (Split)",
    description: "Alerta abastecimentos múltiplos consecutivos de valor baixo no mesmo bico para multiplicar giros de roleta.",
    enabled: true,
    severity: "medium",
    thresholdValue: 15,
    thresholdUnit: "minutos entre abastecimentos no mesmo bico",
  },
  {
    id: "r5",
    code: "off_hours_spike",
    name: "Picos de Cupons Fora de Turno / Madrugada",
    description: "Detecta lançamentos manuais concentrados em horários de movimento mínimo no posto.",
    enabled: true,
    severity: "medium",
    thresholdValue: 4,
    thresholdUnit: "cupons em 20 min na madrugada",
  },
  {
    id: "r6",
    code: "fuel_mismatch",
    name: "Incompatibilidade de Combustível no Mesmo CPF",
    description: "Alerta alternância incompatível entre Diesel e Etanol/Gasolina na mesma conta de cliente.",
    enabled: true,
    severity: "low",
    thresholdValue: 12,
    thresholdUnit: "horas entre trocas de tipo",
  },
];

export const DEFAULT_ATTENDANTS: AttendantSecurityProfile[] = [
  {
    id: "att-1",
    name: "Marcos Paulo Souza",
    code: "FR-0104",
    shift: "Tarde",
    status: "under_review",
    riskScore: 88,
    riskLevel: "critical",
    totalTransactionsMonth: 420,
    discountTransactionsRate: 64, // 64% dos abastecimentos dele têm cupom aplicado
    storeAverageDiscountRate: 28, // média dos outros frentistas é 28%
    openIncidentsCount: 4,
    confirmedFraudsCount: 1,
  },
  {
    id: "att-2",
    name: "Rodrigo Mendonça",
    code: "FR-0089",
    shift: "Noite",
    status: "active",
    riskScore: 58,
    riskLevel: "high",
    totalTransactionsMonth: 310,
    discountTransactionsRate: 46,
    storeAverageDiscountRate: 28,
    openIncidentsCount: 2,
    confirmedFraudsCount: 0,
  },
  {
    id: "att-3",
    name: "Cleiton Barbosa",
    code: "FR-0112",
    shift: "Manhã",
    status: "active",
    riskScore: 18,
    riskLevel: "low",
    totalTransactionsMonth: 540,
    discountTransactionsRate: 27,
    storeAverageDiscountRate: 28,
    openIncidentsCount: 0,
    confirmedFraudsCount: 0,
  },
  {
    id: "att-4",
    name: "Felipe Andrade",
    code: "FR-0125",
    shift: "Manhã",
    status: "active",
    riskScore: 22,
    riskLevel: "low",
    totalTransactionsMonth: 490,
    discountTransactionsRate: 29,
    storeAverageDiscountRate: 28,
    openIncidentsCount: 0,
    confirmedFraudsCount: 0,
  },
  {
    id: "att-5",
    name: "Juliana Santos",
    code: "FR-0130",
    shift: "Tarde",
    status: "active",
    riskScore: 12,
    riskLevel: "low",
    totalTransactionsMonth: 380,
    discountTransactionsRate: 26,
    storeAverageDiscountRate: 28,
    openIncidentsCount: 0,
    confirmedFraudsCount: 0,
  },
];

export const DEFAULT_FRAUD_INCIDENTS: FraudIncident[] = [
  {
    id: "inc-101",
    ruleCode: "same_customer_high_frequency",
    ruleName: "Mesmo CPF Abastecendo Acima da Média",
    severity: "critical",
    status: "pending",
    attendantId: "att-1",
    attendantName: "Marcos Paulo Souza (FR-0104)",
    customerName: "Eduardo Ribeiro (Possível Laranja)",
    customerCpf: "348.912.448-02",
    stationName: "Posto Matriz Central",
    pumpNumber: 4,
    occurredAt: "2026-09-19T16:42:00Z",
    description: "O mesmo CPF pontuou 4 vezes hoje no turno da tarde, totalizando 185 litros em 3 horas no bico 4.",
    evidence: {
      transactionCount: 4,
      timeWindowMinutes: 180,
      totalLiters: 185,
      discountTotalBrl: 46.25,
    },
  },
  {
    id: "inc-102",
    ruleCode: "attendant_discount_anomaly",
    ruleName: "Taxa de Cupons Fora do Padrão",
    severity: "high",
    status: "investigating",
    attendantId: "att-1",
    attendantName: "Marcos Paulo Souza (FR-0104)",
    customerName: "Vários Clientes",
    customerCpf: "Múltiplos",
    stationName: "Posto Matriz Central",
    pumpNumber: 2,
    occurredAt: "2026-09-19T15:15:00Z",
    description: "Frentista aplicou desconto de fidelidade em 64% de todos os seus abastecimentos hoje (Média da equipe: 28%).",
    evidence: {
      anomalyRate: "+36% acima da média da equipe",
      discountTotalBrl: 248.5,
    },
  },
  {
    id: "inc-103",
    ruleCode: "volume_exceeds_tank",
    ruleName: "Volume Acima da Capacidade do Tanque",
    severity: "high",
    status: "pending",
    attendantId: "att-2",
    attendantName: "Rodrigo Mendonça (FR-0089)",
    customerName: "Lucas Ferreira",
    customerCpf: "109.832.118-91",
    stationName: "Posto Matriz Central",
    pumpNumber: 6,
    occurredAt: "2026-09-19T14:10:00Z",
    description: "Abastecimento único de 94 litros de Gasolina Comum registrado para veículo cadastrado como compacto (HB20).",
    evidence: {
      totalLiters: 94,
      fuelType: "Gasolina Comum",
      discountTotalBrl: 18.8,
    },
  },
  {
    id: "inc-104",
    ruleCode: "split_transactions",
    ruleName: "Fracionamento Suspeito de Abastecimento",
    severity: "medium",
    status: "pending",
    attendantId: "att-1",
    attendantName: "Marcos Paulo Souza (FR-0104)",
    customerName: "Carlos Drumont",
    customerCpf: "772.412.399-55",
    stationName: "Posto Matriz Central",
    pumpNumber: 3,
    occurredAt: "2026-09-19T11:20:00Z",
    description: "3 abastecimentos de R$ 35,00 realizados no mesmo bico em um intervalo de 8 minutos com desconto de cupom.",
    evidence: {
      transactionCount: 3,
      timeWindowMinutes: 8,
      discountTotalBrl: 10.5,
    },
  },
  {
    id: "inc-105",
    ruleCode: "off_hours_spike",
    ruleName: "Lançamento em Madrugada com Baixo Fluxo",
    severity: "medium",
    status: "false_positive",
    attendantId: "att-2",
    attendantName: "Rodrigo Mendonça (FR-0089)",
    customerName: "Frota Taxi 24h",
    customerCpf: "554.120.988-34",
    stationName: "Posto Matriz Central",
    pumpNumber: 1,
    occurredAt: "2026-09-19T03:45:00Z",
    description: "5 abastecimentos registrados entre 03:00 e 04:00 da madrugada com cupons manuais.",
    evidence: {
      transactionCount: 5,
      timeWindowMinutes: 45,
      discountTotalBrl: 32.0,
    },
  },
];

