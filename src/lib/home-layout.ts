import { type PromotionalBanner } from "./loyalty";

export type BannerFormat = "horizontal" | "vertical" | "carousel" | "fullscreen" | "popup";

export type TargetAudienceType =
  | "all"
  | "tier"
  | "new_customers"
  | "inactive_customers"
  | "heavy_users"
  | "campaign_mailing";

export interface TargetAudience {
  type: TargetAudienceType;
  tierNames?: string[]; // Ex: ["Bronze", "Prata", "Ouro", "Diamante"]
  campaignId?: string; // ID da campanha associada
  campaignName?: string;
  description?: string;
}

export type HomeBlockType =
  | "level_card"
  | "quick_actions"
  | "banners"
  | "stats_metrics"
  | "active_campaigns"
  | "video"
  | "instagram"
  | "gamification_tiers";

export interface HomeBlockConfig {
  id: string;
  type: HomeBlockType;
  title: string;
  subtitle?: string;
  enabled: boolean;
  sortOrder: number;
  audience?: TargetAudience;
}

export interface QuickActionItem {
  id: string;
  title: string;
  icon: string; // Ex: "Key", "Receipt", "Zap", "Sparkles", "MapPin", "Share2", "MessageCircle", "ShoppingBag", "Wrench", "Flame"
  badge?: string;
  actionType: "route" | "external";
  target: string; // Ex: "/app/token", "/app/historico", "/app/ofertas", "/app/roleta", "https://wa.me/..."
  color?: "primary" | "emerald" | "amber" | "blue" | "purple" | "rose";
  enabled: boolean;
  sortOrder: number;
  audience?: TargetAudience;
}

export interface HomeVideoBlock {
  enabled: boolean;
  title: string;
  subtitle?: string;
  videoType: "youtube" | "vimeo" | "mp4";
  videoUrl: string;
  thumbnailUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  audience?: TargetAudience;
}

export interface HomeInstagramBlock {
  enabled: boolean;
  title: string;
  instagramHandle: string;
  profileName?: string;
  postUrl: string;
  caption: string;
  imageUrl: string;
  postType: "photo" | "reel" | "carousel";
  likesCount?: string;
  commentsCount?: string;
  ctaLabel?: string;
  audience?: TargetAudience;
}

export interface EnhancedBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: "amber" | "emerald" | "blue" | "purple" | "rose";
  theme: "amber" | "emerald" | "blue" | "purple" | "rose" | "dark";
  icon: "coffee" | "wrench" | "droplets" | "sparkles" | "fuel" | "gift" | "tag";
  actionLabel: string;
  actionType: "token" | "roleta" | "ofertas" | "external" | "modal";
  actionUrl?: string;
  imageUrl?: string;
  format: BannerFormat;
  audience: TargetAudience;
  autoCloseSeconds?: number;
  modalDetails?: {
    description: string;
    rules: string[];
    validUntil?: string;
  };
  active: boolean;
  sortOrder: number;
}

export interface HomeLayoutSettings {
  blocks: HomeBlockConfig[];
  banners: EnhancedBanner[];
  quickActions: QuickActionItem[];
  video: HomeVideoBlock;
  instagram: HomeInstagramBlock;
}

export const DEFAULT_HOME_BLOCKS: HomeBlockConfig[] = [
  { id: "block-level", type: "level_card", title: "Card de Nível & Gamificação", enabled: true, sortOrder: 1 },
  { id: "block-quick-actions", type: "quick_actions", title: "Acessos Rápidos", enabled: true, sortOrder: 2 },
  { id: "block-banners", type: "banners", title: "Banners Promocionais", enabled: true, sortOrder: 3 },
  { id: "block-stats", type: "stats_metrics", title: "Métricas & Economia", enabled: true, sortOrder: 4 },
  { id: "block-campaigns", type: "active_campaigns", title: "Campanhas Vigentes", enabled: true, sortOrder: 5 },
  { id: "block-video", type: "video", title: "Vídeo em Destaque", enabled: true, sortOrder: 6 },
  { id: "block-instagram", type: "instagram", title: "Feed & Post do Instagram", enabled: true, sortOrder: 7 },
  { id: "block-tiers", type: "gamification_tiers", title: "Tiers do Programa", enabled: true, sortOrder: 8 },
];

export const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "qa-token",
    title: "Gerar Token",
    icon: "Key",
    badge: "Desconto",
    actionType: "route",
    target: "/app/token",
    color: "primary",
    enabled: true,
    sortOrder: 1,
    audience: { type: "all" },
  },
  {
    id: "qa-ofertas",
    title: "Ofertas",
    icon: "Flame",
    badge: "Hoje",
    actionType: "route",
    target: "/app/ofertas",
    color: "amber",
    enabled: true,
    sortOrder: 2,
    audience: { type: "all" },
  },
  {
    id: "qa-roleta",
    title: "Roleta VIP",
    icon: "Sparkles",
    badge: "Grátis",
    actionType: "route",
    target: "/app/roleta",
    color: "emerald",
    enabled: true,
    sortOrder: 3,
    audience: { type: "all" },
  },
  {
    id: "qa-historico",
    title: "Extrato",
    icon: "Receipt",
    actionType: "route",
    target: "/app/historico",
    color: "blue",
    enabled: true,
    sortOrder: 4,
    audience: { type: "all" },
  },
  {
    id: "qa-whatsapp",
    title: "Atendimento",
    icon: "MessageCircle",
    actionType: "external",
    target: "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20o%20clube",
    color: "emerald",
    enabled: true,
    sortOrder: 5,
    audience: { type: "all" },
  },
  {
    id: "qa-indicar",
    title: "Indicar Amigo",
    icon: "Share2",
    badge: "Bônus",
    actionType: "route",
    target: "/app/ofertas",
    color: "purple",
    enabled: true,
    sortOrder: 6,
    audience: { type: "all" },
  },
];

export const DEFAULT_ENHANCED_BANNERS: EnhancedBanner[] = [
  {
    id: "banner-h1",
    title: "Super Oferta do Dia",
    subtitle: "Ganhe vantagens e descontos imediatos no seu atendimento",
    badge: "DESTAQUE",
    badgeColor: "emerald",
    theme: "emerald",
    icon: "tag",
    actionLabel: "Aproveitar Agora",
    actionType: "ofertas",
    format: "horizontal",
    audience: { type: "all" },
    active: true,
    sortOrder: 1,
    modalDetails: {
      description: "Oferta especial ativa para todos os clientes fidelizados.",
      rules: ["Apresente o token antes do pagamento", "Válido enquanto durar a cota diária"],
      validUntil: "Válido este mês",
    },
  },
  {
    id: "banner-c1",
    title: "Combo VIP & Benefícios Exclusivos",
    subtitle: "Consulte o atendente e garanta itens e serviços cortesia",
    badge: "ESPECIAL",
    badgeColor: "amber",
    theme: "amber",
    icon: "gift",
    actionLabel: "Ver Detalhes",
    actionType: "modal",
    format: "carousel",
    audience: { type: "all" },
    active: true,
    sortOrder: 2,
    modalDetails: {
      description: "Pacote de benefícios adicionais acumulativos com o seu nível de fidelidade.",
      rules: ["Cumulativo com desconto de nível", "Disponível em todas as unidades"],
      validUntil: "Até 31/12/2026",
    },
  },
  {
    id: "banner-v1",
    title: "Clube Diamante & VIP",
    subtitle: "Atendimento prioritário e as maiores vantagens da rede",
    badge: "DIAMANTE",
    badgeColor: "purple",
    theme: "purple",
    icon: "sparkles",
    actionLabel: "Quero Ser VIP",
    actionType: "token",
    format: "vertical",
    audience: { type: "tier", tierNames: ["Ouro", "Diamante"] },
    active: true,
    sortOrder: 3,
  },
  {
    id: "banner-pop1",
    title: "🎉 Bem-vindo ao Clube de Vantagens!",
    subtitle: "Gere seu primeiro token hoje e ganhe desconto imediato no caixa!",
    badge: "BÔNUS DE BOAS-VINDAS",
    badgeColor: "rose",
    theme: "rose",
    icon: "gift",
    actionLabel: "Gerar Meu Token",
    actionType: "token",
    format: "popup",
    audience: { type: "new_customers" },
    active: true,
    sortOrder: 4,
    autoCloseSeconds: 15,
  },
  {
    id: "banner-fs1",
    title: "⚡ MEGA QUARTA DO CLUBE",
    subtitle: "Desconto dobrado hoje para todos os clientes do mailing especial!",
    badge: "OFERTA RELÂMPAGO",
    badgeColor: "blue",
    theme: "blue",
    icon: "sparkles",
    actionLabel: "Acessar Agora",
    actionType: "ofertas",
    format: "fullscreen",
    audience: { type: "campaign_mailing", campaignName: "Quarta Premiada" },
    active: false,
    sortOrder: 5,
    autoCloseSeconds: 8,
  },
];

export const DEFAULT_HOME_VIDEO: HomeVideoBlock = {
  enabled: true,
  title: "Conheça como Funciona o Nosso Clube",
  subtitle: "Veja como acumular descontos e garantir os melhores benefícios a cada visita",
  videoType: "youtube",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  thumbnailUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80",
  ctaLabel: "Saber Mais",
  ctaUrl: "/app/ofertas",
  audience: { type: "all" },
};

export const DEFAULT_HOME_INSTAGRAM: HomeInstagramBlock = {
  enabled: true,
  title: "Siga Nossas Novidades no Instagram",
  instagramHandle: "@fidelidade.oficial",
  profileName: "Clube Fidelidade Oficial",
  postUrl: "https://instagram.com",
  caption: "✨ Novidades da semana chegando! Clientes do aplicativo têm condições exclusivas em todos os nossos serviços e produtos. Venha conferir! #fidelidade #promocao #vantagens",
  imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
  postType: "photo",
  likesCount: "1.248",
  commentsCount: "42",
  ctaLabel: "Seguir no Instagram",
  audience: { type: "all" },
};

export const DEFAULT_HOME_LAYOUT_SETTINGS: HomeLayoutSettings = {
  blocks: DEFAULT_HOME_BLOCKS,
  banners: DEFAULT_ENHANCED_BANNERS,
  quickActions: DEFAULT_QUICK_ACTIONS,
  video: DEFAULT_HOME_VIDEO,
  instagram: DEFAULT_HOME_INSTAGRAM,
};

/**
 * Filtra blocos e banners para a audiência do cliente logado
 */
export function isAudienceMatch(
  audience?: TargetAudience,
  customerData?: {
    tierName?: string;
    isNew?: boolean;
    isInactive?: boolean;
    isHeavyUser?: boolean;
    campaignIds?: string[];
  },
): boolean {
  if (!audience || audience.type === "all") return true;
  if (!customerData) return true;

  switch (audience.type) {
    case "tier":
      if (!audience.tierNames || audience.tierNames.length === 0) return true;
      return Boolean(customerData.tierName && audience.tierNames.includes(customerData.tierName));
    case "new_customers":
      return Boolean(customerData.isNew);
    case "inactive_customers":
      return Boolean(customerData.isInactive);
    case "heavy_users":
      return Boolean(customerData.isHeavyUser);
    case "campaign_mailing":
      if (!audience.campaignId) return true;
      return Boolean(customerData.campaignIds && customerData.campaignIds.includes(audience.campaignId));
    default:
      return true;
  }
}
