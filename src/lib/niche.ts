export type NicheId =
  | "automotive_maintenance"
  | "automotive_aesthetics"
  | "restaurant"
  | "retail"
  | "fuel";

export interface NicheCatalogItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unitLabel: string;
}

export interface NicheTierPreset {
  name: string;
  min: number;
  max: number;
  discountValue: number;
  discountType: "currency_per_unit" | "percentage" | "fixed_discount";
  rewardLabel: string;
  color: string;
}

export interface NicheTerms {
  businessType: string;
  brandFallback: string;
  transactionSingular: string;
  transactionPlural: string;
  actionVerb: string;
  metricLabel: string;
  metricShort: string;
  rewardTypeLabel: string;
  operatorLabel: string;
  locationLabel: string;
  terminalLabel: string;
  clientLabel: string;
  ticketBenchmarkApp: number;
  ticketBenchmarkNoApp: number;
}

export interface NicheConfig {
  id: NicheId;
  name: string;
  subtitle: string;
  badge: string;
  iconName: string;
  terms: NicheTerms;
  catalogItems: NicheCatalogItem[];
  tierPresets: NicheTierPreset[];
  promoTips: string[];
}

export const NICHES: Record<NicheId, NicheConfig> = {
  automotive_maintenance: {
    id: "automotive_maintenance",
    name: "Serviços de Manutenção & Oficina",
    subtitle: "Oficinas Mecânicas, Auto Centers, Troca de Óleo e Centros Automotivos",
    badge: "Oficina & Mecânica",
    iconName: "Wrench",
    terms: {
      businessType: "Centro Automotivo & Oficina",
      brandFallback: "AutoCare Fidelidade",
      transactionSingular: "Ordem de Serviço (OS)",
      transactionPlural: "Ordens de Serviço",
      actionVerb: "Registrar Serviço",
      metricLabel: "Faturamento em Serviços",
      metricShort: "R$",
      rewardTypeLabel: "Desconto em Peças & Mão de Obra",
      operatorLabel: "Consultor Técnico / Mecânico",
      locationLabel: "Box / Elevador",
      terminalLabel: "Terminal da Oficina",
      clientLabel: "Proprietário do Veículo",
      ticketBenchmarkApp: 580.0,
      ticketBenchmarkNoApp: 410.0,
    },
    catalogItems: [
      { id: "serv-1", name: "Troca de Óleo 100% Sintético + Filtros", category: "Preventiva", unitPrice: 280, unitLabel: "serviço" },
      { id: "serv-2", name: "Alinhamento 3D + Balanceamento 4 Rodas", category: "Geometria", unitPrice: 140, unitLabel: "serviço" },
      { id: "serv-3", name: "Revisão Geral de Freios (Pastilhas + Fluido)", category: "Segurança", unitPrice: 380, unitLabel: "serviço" },
      { id: "serv-4", name: "Higienização de Ar-Condicionado + Troca Filtro", category: "Climatização", unitPrice: 120, unitLabel: "serviço" },
      { id: "serv-5", name: "Troca de Kit Correia Dentada e Tensores", category: "Motor", unitPrice: 650, unitLabel: "serviço" },
    ],
    tierPresets: [
      { name: "Bronze", min: 0, max: 500, discountValue: 5, discountType: "percentage", rewardLabel: "5% OFF em Serviços", color: "tier-bronze" },
      { name: "Prata", min: 501, max: 1500, discountValue: 8, discountType: "percentage", rewardLabel: "8% OFF + Alinhamento Grátis", color: "tier-silver" },
      { name: "Ouro", min: 1501, max: 3000, discountValue: 12, discountType: "percentage", rewardLabel: "12% OFF + Higienização de Ar Grátis", color: "tier-gold" },
      { name: "Diamante", min: 3001, max: 99999, discountValue: 15, discountType: "percentage", rewardLabel: "15% OFF VIP + Check-up 50 itens cortesia", color: "tier-diamond" },
    ],
    promoTips: [
      "Quarta-feira da Troca de Óleo: filtro de óleo grátis em ordens acima de R$ 250",
      "Revisão de Férias: 10% OFF no pacote completo de suspensão e freios",
      "Indique um Amigo: R$ 50 de crédito para cada novo cliente indicado",
    ],
  },

  automotive_aesthetics: {
    id: "automotive_aesthetics",
    name: "Estética Automotiva & Lava-Rápido",
    subtitle: "Detailing, Polimento Técnico, Vitrificação, Martelinho e Lavagens Premium",
    badge: "Estética & Detailing",
    iconName: "Sparkles",
    terms: {
      businessType: "Estética Automotiva & Studio",
      brandFallback: "GlossAuto Club",
      transactionSingular: "Atendimento de Estética",
      transactionPlural: "Atendimentos",
      actionVerb: "Registrar Atendimento",
      metricLabel: "Volume de Serviços Concluídos",
      metricShort: "serviços",
      rewardTypeLabel: "Desconto no Serviço / Upgrade Cortesia",
      operatorLabel: "Detailer / Atendente de Box",
      locationLabel: "Box de Detailing",
      terminalLabel: "Terminal de Estética",
      clientLabel: "Cliente VIP",
      ticketBenchmarkApp: 185.0,
      ticketBenchmarkNoApp: 110.0,
    },
    catalogItems: [
      { id: "aest-1", name: "Lavagem Detalhada com Cera de Carnaúba", category: "Lavagem", unitPrice: 90, unitLabel: "lavagem" },
      { id: "aest-2", name: "Higienização Interna Completa e Oxi-sanitização", category: "Interior", unitPrice: 280, unitLabel: "serviço" },
      { id: "aest-3", name: "Polimento Comercial + Selante de Pintura", category: "Pintura", unitPrice: 380, unitLabel: "serviço" },
      { id: "aest-4", name: "Vitrificação Cerâmica 9H (Garantia 3 Anos)", category: "Proteção", unitPrice: 1200, unitLabel: "aplicação" },
      { id: "aest-5", name: "Limpeza e Hidratação de Bancos de Couro", category: "Interior", unitPrice: 160, unitLabel: "serviço" },
    ],
    tierPresets: [
      { name: "Bronze", min: 0, max: 200, discountValue: 5, discountType: "percentage", rewardLabel: "5% OFF em Lavagens", color: "tier-bronze" },
      { name: "Prata", min: 201, max: 600, discountValue: 10, discountType: "percentage", rewardLabel: "10% OFF + Cera Líquida Cortesia", color: "tier-silver" },
      { name: "Ouro", min: 601, max: 1500, discountValue: 15, discountType: "percentage", rewardLabel: "15% OFF + Hidratação de Plásticos", color: "tier-gold" },
      { name: "Diamante", min: 1501, max: 99999, discountValue: 20, discountType: "percentage", rewardLabel: "20% OFF + 5ª Lavagem 100% Grátis", color: "tier-diamond" },
    ],
    promoTips: [
      "Terça do Brilho: 50% OFF na cristalização de para-brisas",
      "Sábado Premium: Aspiração profunda e perfume automotivo cortesia",
      "Passaporte Mensal: 4 lavagens com 20% de economia garantida",
    ],
  },

  restaurant: {
    id: "restaurant",
    name: "Restaurantes & Gastronomia",
    subtitle: "Bares, Hamburguerias, Cafeterias, Pizzarias e Restaurantes a la carte",
    badge: "Gastronomia & Bares",
    iconName: "Utensils",
    terms: {
      businessType: "Restaurante & Bar",
      brandFallback: "GourmetRewards",
      transactionSingular: "Consumo / Comanda",
      transactionPlural: "Comandas Fechadas",
      actionVerb: "Registrar Consumo",
      metricLabel: "Faturamento em Mesas & Balcão",
      metricShort: "R$",
      rewardTypeLabel: "Desconto na Conta / Prato Cortesia",
      operatorLabel: "Garçom / Atendente de Salão",
      locationLabel: "Mesa / Comanda",
      terminalLabel: "Terminal do Salão / Caixa",
      clientLabel: "Comensal / Cliente",
      ticketBenchmarkApp: 165.0,
      ticketBenchmarkNoApp: 105.0,
    },
    catalogItems: [
      { id: "rest-1", name: "Combo Burger Artesanal + Batata Rústica", category: "Principais", unitPrice: 52, unitLabel: "combo" },
      { id: "rest-2", name: "Pizza Grande Especial Forno a Lenha", category: "Pizzas", unitPrice: 84, unitLabel: "unidade" },
      { id: "rest-3", name: "Prato Executivo Gourmet (Almoço)", category: "Almoço", unitPrice: 42, unitLabel: "prato" },
      { id: "rest-4", name: "Chopp Artesanal 500ml", category: "Bebidas", unitPrice: 16, unitLabel: "caneca" },
      { id: "rest-5", name: "Sobremesa Especial da Casa (Petit Gâteau)", category: "Sobremesas", unitPrice: 28, unitLabel: "porção" },
    ],
    tierPresets: [
      { name: "Bronze", min: 0, max: 150, discountValue: 5, discountType: "percentage", rewardLabel: "5% de Desconto na Conta", color: "tier-bronze" },
      { name: "Prata", min: 151, max: 400, discountValue: 10, discountType: "percentage", rewardLabel: "10% OFF + Café Espresso Cortesia", color: "tier-silver" },
      { name: "Ouro", min: 401, max: 900, discountValue: 12, discountType: "percentage", rewardLabel: "12% OFF + Sobremesa Cortesia", color: "tier-gold" },
      { name: "Diamante", min: 901, max: 99999, discountValue: 15, discountType: "percentage", rewardLabel: "15% OFF VIP + Reserva Prioritária de Mesa", color: "tier-diamond" },
    ],
    promoTips: [
      "Quarta do Chopp Duplo: Peça 1 chopp e o segundo é cortesia do clube",
      "Almoço Fidelidade: A cada 10 almoços executivos, 1 sai por conta da casa",
      "Sobremesa de Aniversário: Grátis durante todo o mês do aniversariante",
    ],
  },

  retail: {
    id: "retail",
    name: "Varejo & Lojas em Geral",
    subtitle: "Lojas de Roupas, Conveniências, Mercados, Pet Shops e Comércio Geral",
    badge: "Varejo & Lojas",
    iconName: "ShoppingBag",
    terms: {
      businessType: "Loja & Varejo",
      brandFallback: "VarejoVIP Clube",
      transactionSingular: "Compra no PDV",
      transactionPlural: "Compras Registradas",
      actionVerb: "Registrar Compra",
      metricLabel: "Faturamento em Vendas",
      metricShort: "R$",
      rewardTypeLabel: "Desconto Direto no Caixa",
      operatorLabel: "Operador de Caixa / Vendedor",
      locationLabel: "PDV / Caixa",
      terminalLabel: "Terminal do Caixa (PDV)",
      clientLabel: "Consumidor / Cliente",
      ticketBenchmarkApp: 142.0,
      ticketBenchmarkNoApp: 89.0,
    },
    catalogItems: [
      { id: "ret-1", name: "Cesta Básica / Kit Essencial Semanal", category: "Mercado", unitPrice: 120, unitLabel: "kit" },
      { id: "ret-2", name: "Ração Premium Cães/Gatos 15kg", category: "Pet", unitPrice: 195, unitLabel: "saco" },
      { id: "ret-3", name: "Peça de Vestuário Coleção Atual", category: "Moda", unitPrice: 89, unitLabel: "peça" },
      { id: "ret-4", name: "Pack Bebidas / Conveniência", category: "Bebidas", unitPrice: 36, unitLabel: "pack" },
      { id: "ret-5", name: "Acessórios e Utilidades", category: "Geral", unitPrice: 45, unitLabel: "unidade" },
    ],
    tierPresets: [
      { name: "Bronze", min: 0, max: 200, discountValue: 5, discountType: "percentage", rewardLabel: "5% de Desconto Imediato", color: "tier-bronze" },
      { name: "Prata", min: 201, max: 600, discountValue: 8, discountType: "percentage", rewardLabel: "8% OFF em Todo o Carrinho", color: "tier-silver" },
      { name: "Ouro", min: 601, max: 1400, discountValue: 12, discountType: "percentage", rewardLabel: "12% OFF + Brinde Exclusivo do Mês", color: "tier-gold" },
      { name: "Diamante", min: 1401, max: 99999, discountValue: 15, discountType: "percentage", rewardLabel: "15% OFF VIP + Frete/Entrega Grátis", color: "tier-diamond" },
    ],
    promoTips: [
      "Quinta do Cliente VIP: Cupons exclusivos de 15% OFF nas categorias premium",
      "Cashback Imediato: R$ 20 de desconto em compras acima de R$ 150 no fim de semana",
      "Aniversariante VIP: Presente surpresa retirável em loja no mês do aniversário",
    ],
  },

  fuel: {
    id: "fuel",
    name: "Postos de Combustíveis & Energia",
    subtitle: "Postos Urbanos e Rodoviários, GNV, Carregamento Elétrico e Pista de Abastecimento",
    badge: "Postos & Combustível",
    iconName: "Fuel",
    terms: {
      businessType: "Rede de Postos de Combustíveis",
      brandFallback: "FuelRewards",
      transactionSingular: "Abastecimento",
      transactionPlural: "Abastecimentos",
      actionVerb: "Abastecer com Desconto",
      metricLabel: "Volume Abastecido (Galonagem)",
      metricShort: "L",
      rewardTypeLabel: "Desconto Direto na Bomba",
      operatorLabel: "Frentista",
      locationLabel: "Bomba / Pista",
      terminalLabel: "Monitor de Pista",
      clientLabel: "Motorista",
      ticketBenchmarkApp: 248.5,
      ticketBenchmarkNoApp: 172.3,
    },
    catalogItems: [
      { id: "fuel-1", name: "Gasolina Comum", category: "Combustível", unitPrice: 5.89, unitLabel: "litro" },
      { id: "fuel-2", name: "Gasolina Aditivada Grid", category: "Combustível", unitPrice: 6.19, unitLabel: "litro" },
      { id: "fuel-3", name: "Etanol Hidratado", category: "Combustível", unitPrice: 3.99, unitLabel: "litro" },
      { id: "fuel-4", name: "Diesel S10", category: "Combustível", unitPrice: 5.95, unitLabel: "litro" },
      { id: "fuel-5", name: "Aditivo de Combustível Pro", category: "Lubrificante", unitPrice: 35.0, unitLabel: "frasco" },
    ],
    tierPresets: [
      { name: "Bronze", min: 0, max: 50, discountValue: 0.05, discountType: "currency_per_unit", rewardLabel: "R$ 0,05 / Litro", color: "tier-bronze" },
      { name: "Prata", min: 51, max: 150, discountValue: 0.08, discountType: "currency_per_unit", rewardLabel: "R$ 0,08 / Litro", color: "tier-silver" },
      { name: "Ouro", min: 151, max: 300, discountValue: 0.1, discountType: "currency_per_unit", rewardLabel: "R$ 0,10 / Litro", color: "tier-gold" },
      { name: "Diamante", min: 301, max: 99999, discountValue: 0.15, discountType: "currency_per_unit", rewardLabel: "R$ 0,15 / Litro", color: "tier-diamond" },
    ],
    promoTips: [
      "Super Quarta do Combustível: +R$ 0,25/L em abastecimentos acima de R$ 120",
      "Fim de Semana Premiado: Desconto turbinado para tanques cheios no sábado e domingo",
      "Semana do Etanol Limpo: Incentivo de preço com bônus extra de fidelidade",
    ],
  },
};

export const DEFAULT_NICHE_ID: NicheId = "automotive_maintenance";

export function getNicheConfig(nicheId?: string | null): NicheConfig {
  if (!nicheId || !(nicheId in NICHES)) {
    return NICHES[DEFAULT_NICHE_ID];
  }
  return NICHES[nicheId as NicheId];
}
