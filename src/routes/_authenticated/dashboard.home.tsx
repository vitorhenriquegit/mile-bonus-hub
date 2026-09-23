import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutTemplate,
  Layers,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Save,
  Loader2,
  Eye,
  Smartphone,
  Video as VideoIcon,
  Instagram,
  Sparkles,
  Zap,
  Tag,
  Key,
  Flame,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
  Users,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  getHomeLayoutSettings,
  saveHomeLayoutSettings,
  getActiveCustomerCampaigns,
  getTiers,
} from "@/lib/loyalty.functions";
import {
  DEFAULT_HOME_LAYOUT_SETTINGS,
  type HomeLayoutSettings,
  type HomeBlockConfig,
  type QuickActionItem,
  type EnhancedBanner,
  type BannerFormat,
  type TargetAudienceType,
  isAudienceMatch,
} from "@/lib/home-layout";
import { HomeQuickActions } from "@/components/HomeQuickActions";
import { HomeVideoPlayer } from "@/components/HomeVideoPlayer";
import { HomeInstagramCard } from "@/components/HomeInstagramCard";
import { EnhancedBannerRenderer } from "@/components/EnhancedBannerRenderer";
import { HomePopupBanner } from "@/components/HomePopupBanner";
import { HomeFullscreenBanner } from "@/components/HomeFullscreenBanner";
import { useNiche } from "@/lib/niche-context";
import { NicheIcon } from "@/components/NicheIcon";
import { formatBRL } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/dashboard/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Personalização da Home — FuelRewards Gestor" },
      {
        name: "description",
        content:
          "Gerencie a ordem dos blocos, acessos rápidos, banners multi-formato, vídeos, Instagram e segmentação da Home.",
      },
    ],
  }),
  component: DashboardHomePage,
});

function DashboardHomePage() {
  const queryClient = useQueryClient();
  const { currentNiche } = useNiche();
  const getLayoutFn = useServerFn(getHomeLayoutSettings);
  const saveLayoutFn = useServerFn(saveHomeLayoutSettings);
  const campaignsFn = useServerFn(getActiveCustomerCampaigns);
  const tiersFn = useServerFn(getTiers);

  const layoutQuery = useQuery({
    queryKey: ["home-layout-settings"],
    queryFn: () => getLayoutFn({}),
  });
  const campaignsQuery = useQuery({
    queryKey: ["customer-campaigns"],
    queryFn: () => campaignsFn({}) as Promise<any[]>,
  });
  const tiersQuery = useQuery({
    queryKey: ["tiers"],
    queryFn: () => tiersFn({}) as Promise<any[]>,
  });

  const [settings, setSettings] = useState<HomeLayoutSettings>(DEFAULT_HOME_LAYOUT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"blocks" | "banners" | "quickActions" | "media">("blocks");
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0);
  const [previewProfile, setPreviewProfile] = useState<"all" | "diamond" | "new" | "inactive">("all");
  const [testPopupOpen, setTestPopupOpen] = useState(false);
  const [testFullscreenOpen, setTestFullscreenOpen] = useState(false);

  useEffect(() => {
    if (layoutQuery.data) {
      setSettings(layoutQuery.data);
    }
  }, [layoutQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (data: HomeLayoutSettings) => saveLayoutFn({ data }),
    onSuccess: () => {
      toast.success("Configurações da Home salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["home-layout-settings"] });
      queryClient.invalidateQueries({ queryKey: ["customer-home-layout"] });
    },
    onError: () => toast.error("Erro ao salvar configurações da Home."),
  });

  // Reordenação de blocos
  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...settings.blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    // Atualiza sortOrder
    const reordered = newBlocks.map((b, idx) => ({ ...b, sortOrder: idx + 1 }));
    setSettings({ ...settings, blocks: reordered });
  };

  const toggleBlock = (id: string) => {
    const updated = settings.blocks.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b));
    setSettings({ ...settings, blocks: updated });
  };

  // Gestão de Banners
  const handleAddBanner = (format: BannerFormat = "horizontal") => {
    const newId = `banner-${Date.now()}`;
    const newBanner: EnhancedBanner = {
      id: newId,
      title: "Novo Banner Promocional",
      subtitle: "Desconto e benefícios exclusivos para clientes",
      badge: "NOVO",
      badgeColor: "emerald",
      theme: "emerald",
      icon: "tag",
      actionLabel: "Ver Oferta",
      actionType: "ofertas",
      format,
      audience: { type: "all" },
      active: true,
      sortOrder: settings.banners.length + 1,
    };
    const updated = [...settings.banners, newBanner];
    setSettings({ ...settings, banners: updated });
    setSelectedBannerIndex(updated.length - 1);
  };

  const handleDeleteBanner = (index: number) => {
    const updated = settings.banners.filter((_, idx) => idx !== index);
    setSettings({ ...settings, banners: updated });
    setSelectedBannerIndex(Math.max(0, index - 1));
  };

  const updateCurrentBanner = (patch: Partial<EnhancedBanner>) => {
    const updated = settings.banners.map((b, idx) =>
      idx === selectedBannerIndex ? { ...b, ...patch } : b,
    );
    setSettings({ ...settings, banners: updated });
  };

  // Gestão de Acessos Rápidos
  const handleAddQuickAction = () => {
    const newId = `qa-${Date.now()}`;
    const newQA: QuickActionItem = {
      id: newId,
      title: "Novo Atalho",
      icon: "Zap",
      actionType: "route",
      target: "/app/ofertas",
      color: "primary",
      enabled: true,
      sortOrder: settings.quickActions.length + 1,
      audience: { type: "all" },
    };
    setSettings({ ...settings, quickActions: [...settings.quickActions, newQA] });
  };

  const handleDeleteQuickAction = (id: string) => {
    setSettings({
      ...settings,
      quickActions: settings.quickActions.filter((q) => q.id !== id),
    });
  };

  const updateQuickAction = (id: string, patch: Partial<QuickActionItem>) => {
    setSettings({
      ...settings,
      quickActions: settings.quickActions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    });
  };

  const currentBanner = settings.banners[selectedBannerIndex] || settings.banners[0];
  const sortedBlocks = [...settings.blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  // Filtra banners e blocos para o preview conforme o perfil simulado
  const simulatedCustomer = {
    tierName: previewProfile === "diamond" ? "Diamante" : "Bronze",
    isNew: previewProfile === "new",
    isInactive: previewProfile === "inactive",
    isHeavyUser: previewProfile === "diamond",
  };

  const previewBanners = settings.banners.filter((b) => isAudienceMatch(b.audience, simulatedCustomer));
  const previewQuickActions = settings.quickActions.filter((q) => isAudienceMatch(q.audience, simulatedCustomer));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Personalização da Home do App
              </h1>
              <p className="text-xs text-muted-foreground">
                Ajuste posições de blocos, atalhos, banners multi-formato, vídeos e audiências de clientes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSettings(DEFAULT_HOME_LAYOUT_SETTINGS)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted shadow-xs transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Restaurar Padrão
          </button>

          <button
            type="button"
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-card hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Layout da Home
          </button>
        </div>
      </div>

      {/* Main Grid: Left Settings / Right Mobile Simulator */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Lado Esquerdo: Abas de Configuração (Col 7) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Navegação de Abas */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab("blocks")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === "blocks"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Layers className="h-4 w-4" />
              Posições & Blocos ({settings.blocks.filter((b) => b.enabled).length})
            </button>

            <button
              onClick={() => setActiveTab("banners")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === "banners"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Tag className="h-4 w-4" />
              Banners & Formatos ({settings.banners.length})
            </button>

            <button
              onClick={() => setActiveTab("quickActions")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === "quickActions"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Zap className="h-4 w-4" />
              Acessos Rápidos ({settings.quickActions.filter((q) => q.enabled).length})
            </button>

            <button
              onClick={() => setActiveTab("media")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === "media"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <VideoIcon className="h-4 w-4" />
              Vídeo & Instagram
            </button>
          </div>

          {/* ABA 1: POSIÇÕES E REORDENAÇÃO DE BLOCOS */}
          {activeTab === "blocks" && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Ordem dos Blocos na Home</h2>
                  <p className="text-xs text-muted-foreground">
                    Organize o fluxo de navegação do app. Use as setas para ajustar a posição de cada bloco.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {sortedBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                      block.enabled
                        ? "border-border bg-background shadow-xs"
                        : "border-dashed border-border/70 bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-xs font-bold text-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">{block.title}</h3>
                          <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                            {block.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {block.enabled ? "Exibido na Home" : "Oculto no app"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, "up")}
                        disabled={index === 0}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30"
                        title="Subir posição"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveBlock(index, "down")}
                        disabled={index === sortedBlocks.length - 1}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30"
                        title="Descer posição"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBlock(block.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          block.enabled
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {block.enabled ? "Ativo" : "Inativo"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 2: BANNERS E MÚLTIPLOS FORMATOS */}
          {activeTab === "banners" && (
            <div className="space-y-4">
              {/* Header com botões de adicionar formato */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <div>
                  <h2 className="text-base font-bold text-foreground">Banners Multi-Formato</h2>
                  <p className="text-xs text-muted-foreground">
                    Crie banners nos formatos horizontal, vertical (stories), carrossel, pop-up ou tela inteira.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleAddBanner("horizontal")}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 text-xs font-bold hover:bg-primary/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Horizontal
                  </button>
                  <button
                    onClick={() => handleAddBanner("vertical")}
                    className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1.5 text-xs font-bold hover:bg-purple-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Vertical
                  </button>
                  <button
                    onClick={() => handleAddBanner("carousel")}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1.5 text-xs font-bold hover:bg-amber-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Carrossel
                  </button>
                  <button
                    onClick={() => handleAddBanner("popup")}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1.5 text-xs font-bold hover:bg-rose-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Pop-up
                  </button>
                  <button
                    onClick={() => handleAddBanner("fullscreen")}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 text-xs font-bold hover:bg-blue-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tela Inteira
                  </button>
                </div>
              </div>

              {/* Lista e Editor de Banner */}
              <div className="grid gap-4 sm:grid-cols-12">
                {/* Seletor de Banners (Col 4) */}
                <div className="space-y-2 sm:col-span-5">
                  <div className="rounded-2xl border border-border bg-card p-3 shadow-card space-y-2 max-h-[500px] overflow-y-auto">
                    {settings.banners.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBannerIndex(idx)}
                        className={`w-full text-left rounded-xl p-3 border transition ${
                          idx === selectedBannerIndex
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-accent px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-muted-foreground">
                            {b.format}
                          </span>
                          <span
                            className={`h-2 w-2 rounded-full ${
                              b.active ? "bg-emerald-500" : "bg-muted-foreground"
                            }`}
                          />
                        </div>
                        <h4 className="mt-1 text-xs font-bold text-foreground truncate">{b.title}</h4>
                        <p className="text-[11px] text-muted-foreground truncate">{b.subtitle}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Aud: {b.audience?.type}</span>
                          <span>#{b.sortOrder}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulário do Banner Selecionado (Col 7) */}
                {currentBanner && (
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:col-span-7 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Editar Banner</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Formato: <strong className="uppercase">{currentBanner.format}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentBanner.format === "popup" && (
                          <button
                            type="button"
                            onClick={() => setTestPopupOpen(true)}
                            className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-primary hover:bg-accent/80"
                          >
                            <Eye className="h-3 w-3" /> Testar
                          </button>
                        )}
                        {currentBanner.format === "fullscreen" && (
                          <button
                            type="button"
                            onClick={() => setTestFullscreenOpen(true)}
                            className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-primary hover:bg-accent/80"
                          >
                            <Eye className="h-3 w-3" /> Testar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(selectedBannerIndex)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
                          title="Excluir banner"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Formato</label>
                          <select
                            value={currentBanner.format}
                            onChange={(e) => updateCurrentBanner({ format: e.target.value as BannerFormat })}
                            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                          >
                            <option value="horizontal">Horizontal (Widescreen 16:9)</option>
                            <option value="vertical">Vertical (Stories / Card)</option>
                            <option value="carousel">Carrossel de Slides</option>
                            <option value="popup">Pop-up Promocional</option>
                            <option value="fullscreen">Tela Inteira (Splash)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Tema Visual</label>
                          <select
                            value={currentBanner.theme}
                            onChange={(e) => updateCurrentBanner({ theme: e.target.value as any })}
                            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                          >
                            <option value="emerald">Verde Esmeralda</option>
                            <option value="amber">Âmbar Dourado</option>
                            <option value="blue">Azul Safira</option>
                            <option value="purple">Roxo VIP</option>
                            <option value="rose">Rosa / Coral</option>
                            <option value="dark">Escuro / Premium</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Título Principal</label>
                        <input
                          type="text"
                          value={currentBanner.title}
                          onChange={(e) => updateCurrentBanner({ title: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Subtítulo / Descrição</label>
                        <input
                          type="text"
                          value={currentBanner.subtitle}
                          onChange={(e) => updateCurrentBanner({ subtitle: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Badge / Selo</label>
                          <input
                            type="text"
                            value={currentBanner.badge}
                            onChange={(e) => updateCurrentBanner({ badge: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Texto do Botão CTA</label>
                          <input
                            type="text"
                            value={currentBanner.actionLabel}
                            onChange={(e) => updateCurrentBanner({ actionLabel: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">
                          URL da Imagem de Fundo (Opcional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={currentBanner.imageUrl || ""}
                          onChange={(e) => updateCurrentBanner({ imageUrl: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                        />
                      </div>

                      {/* SEGMENTAÇÃO POR PERFIL / MAILING */}
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold text-foreground">
                            Segmentação de Público / Mailing
                          </h4>
                        </div>

                        <select
                          value={currentBanner.audience?.type || "all"}
                          onChange={(e) =>
                            updateCurrentBanner({
                              audience: {
                                ...currentBanner.audience,
                                type: e.target.value as TargetAudienceType,
                              },
                            })
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                        >
                          <option value="all">👥 Todos os Clientes</option>
                          <option value="tier">🏆 Segmentar por Nível (Tiers)</option>
                          <option value="new_customers">✨ Novos Clientes (&lt; 30 dias)</option>
                          <option value="inactive_customers">⏰ Clientes Inativos / Churn</option>
                          <option value="heavy_users">💎 Clientes Frequentes / Alto Ticket</option>
                          <option value="campaign_mailing">📬 Mailing de Campanha Específica</option>
                        </select>

                        {currentBanner.audience?.type === "campaign_mailing" && (
                          <div className="mt-2">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                              Campanha Vinculada
                            </label>
                            <select
                              value={currentBanner.audience?.campaignId || ""}
                              onChange={(e) =>
                                updateCurrentBanner({
                                  audience: {
                                    ...currentBanner.audience,
                                    type: "campaign_mailing",
                                    campaignId: e.target.value,
                                    campaignName: campaignsQuery.data?.find((c) => c.id === e.target.value)?.title,
                                  },
                                })
                              }
                              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium"
                            >
                              <option value="">Selecione uma campanha...</option>
                              {campaignsQuery.data?.map((camp) => (
                                <option key={camp.id} value={camp.id}>
                                  {camp.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={currentBanner.active}
                            onChange={(e) => updateCurrentBanner({ active: e.target.checked })}
                            className="h-4 w-4 rounded accent-primary"
                          />
                          <span>Banner ativo e visível</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 3: ACESSOS RÁPIDOS */}
          {activeTab === "quickActions" && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Acessos Rápidos da Home</h2>
                  <p className="text-xs text-muted-foreground">
                    Atalhos em grade para navegação rápida do cliente no app mobile
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuickAction}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> Novo Atalho
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {settings.quickActions.map((qa) => (
                  <div
                    key={qa.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={qa.title}
                          onChange={(e) => updateQuickAction(qa.id, { title: e.target.value })}
                          className="font-bold text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {qa.target}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={qa.icon}
                        onChange={(e) => updateQuickAction(qa.id, { icon: e.target.value })}
                        className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
                      >
                        <option value="Key">Chave / Token</option>
                        <option value="Flame">Chama / Ofertas</option>
                        <option value="Sparkles">Brilho / Roleta</option>
                        <option value="Receipt">Recibo / Extrato</option>
                        <option value="MessageCircle">WhatsApp / Chat</option>
                        <option value="Share2">Compartilhar</option>
                        <option value="ShoppingBag">Sacola / Loja</option>
                        <option value="Wrench">Ferramenta / Oficina</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Badge (Ex: Novo)"
                        value={qa.badge || ""}
                        onChange={(e) => updateQuickAction(qa.id, { badge: e.target.value })}
                        className="w-20 rounded-lg border border-border bg-card px-2 py-1 text-xs"
                      />

                      <button
                        type="button"
                        onClick={() => updateQuickAction(qa.id, { enabled: !qa.enabled })}
                        className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
                          qa.enabled
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {qa.enabled ? "Ativo" : "Inativo"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuickAction(qa.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                        title="Excluir atalho"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 4: VÍDEO E INSTAGRAM */}
          {activeTab === "media" && (
            <div className="space-y-5">
              {/* Card de Configuração de Vídeo */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <VideoIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Vídeo em Destaque</h2>
                      <p className="text-xs text-muted-foreground">
                        Incorpore vídeos do YouTube, Vimeo ou link direto MP4 na Home
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.video.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          video: { ...settings.video, enabled: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>Exibir na Home</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Tipo de Vídeo</label>
                      <select
                        value={settings.video.videoType}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            video: { ...settings.video, videoType: e.target.value as any },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                      >
                        <option value="youtube">YouTube Embed</option>
                        <option value="vimeo">Vimeo Embed</option>
                        <option value="mp4">Vídeo Direto (MP4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">URL do Vídeo</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={settings.video.videoUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            video: { ...settings.video, videoUrl: e.target.value },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Título do Vídeo</label>
                    <input
                      type="text"
                      value={settings.video.title}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          video: { ...settings.video, title: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Subtítulo / Descrição Curta
                    </label>
                    <input
                      type="text"
                      value={settings.video.subtitle || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          video: { ...settings.video, subtitle: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Texto do Botão CTA</label>
                      <input
                        type="text"
                        placeholder="Ex: Saber Mais"
                        value={settings.video.ctaLabel || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            video: { ...settings.video, ctaLabel: e.target.value },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Link do Botão CTA</label>
                      <input
                        type="text"
                        placeholder="Ex: /app/ofertas ou link externo"
                        value={settings.video.ctaUrl || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            video: { ...settings.video, ctaUrl: e.target.value },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Configuração do Instagram */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-500">
                      <Instagram className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Post / Feed do Instagram</h2>
                      <p className="text-xs text-muted-foreground">
                        Mostre postagens recentes, fotos ou Reels oficiais da sua loja
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.instagram.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          instagram: { ...settings.instagram, enabled: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>Exibir na Home</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Perfil (@handle)</label>
                      <input
                        type="text"
                        value={settings.instagram.instagramHandle}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            instagram: { ...settings.instagram, instagramHandle: e.target.value },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Tipo de Post</label>
                      <select
                        value={settings.instagram.postType}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            instagram: { ...settings.instagram, postType: e.target.value as any },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                      >
                        <option value="photo">Foto Simples</option>
                        <option value="reel">Reels / Vídeo Curto</option>
                        <option value="carousel">Carrossel de Fotos</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">URL da Imagem / Capa</label>
                    <input
                      type="url"
                      value={settings.instagram.imageUrl}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          instagram: { ...settings.instagram, imageUrl: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Legenda do Post</label>
                    <textarea
                      rows={2}
                      value={settings.instagram.caption}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          instagram: { ...settings.instagram, caption: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs font-medium"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Curtidas (Ex: 1.4k)</label>
                      <input
                        type="text"
                        value={settings.instagram.likesCount || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            instagram: { ...settings.instagram, likesCount: e.target.value },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Link Direto do Post</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/p/..."
                        value={settings.instagram.postUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            instagram: { ...settings.instagram, postUrl: e.target.value },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Simulador Mobile em Tempo Real (Col 5) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 space-y-3">
            {/* Seletor de Perfil no Simulador */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-xs">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" />
                Live Preview
              </span>

              <select
                value={previewProfile}
                onChange={(e) => setPreviewProfile(e.target.value as any)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="all">Visão: Todos os Clientes</option>
                <option value="diamond">Visão: Cliente Diamante VIP</option>
                <option value="new">Visão: Novo Cliente (Bônus)</option>
                <option value="inactive">Visão: Cliente Inativo</option>
              </select>
            </div>

            {/* Frame do Smartphone */}
            <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[40px] border-4 border-stone-800 bg-background shadow-float ring-1 ring-border">
              {/* Top Notch / Dynamic Island */}
              <div className="flex items-center justify-between px-6 pt-3 pb-2 text-[10px] font-bold text-foreground bg-background">
                <span>9:41</span>
                <div className="h-4 w-20 rounded-full bg-stone-900" />
                <span>5G 100%</span>
              </div>

              {/* Scrollable Mobile Screen */}
              <div className="max-h-[640px] overflow-y-auto px-4 pb-12 pt-2 space-y-4">
                {/* Mobile Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                      <NicheIcon name={currentNiche.iconName} className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Olá,</p>
                      <p className="text-xs font-bold text-foreground">
                        {previewProfile === "diamond" ? "Carlos (VIP)" : "Motorista"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                    {previewProfile === "diamond" ? "Diamante" : "Bronze"}
                  </span>
                </div>

                {/* Renderização Dinâmica dos Blocos na Ordem */}
                {sortedBlocks.map((block) => {
                  if (!block.enabled) return null;

                  switch (block.type) {
                    case "level_card":
                      return (
                        <div
                          key={block.id}
                          className="rounded-2xl p-4 text-white shadow-card"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                              Nível {previewProfile === "diamond" ? "Diamante" : "Bronze"}
                            </span>
                            <Zap className="h-4 w-4" />
                          </div>
                          <p className="mt-2 text-2xl font-black">
                            {previewProfile === "diamond" ? "R$ 0,15" : "R$ 0,05"}
                            <span className="text-xs font-medium opacity-85">/{currentNiche.terms.metricShort}</span>
                          </p>
                          <p className="text-[10px] opacity-80 mt-1">Desconto aplicado direto no caixa</p>
                        </div>
                      );

                    case "quick_actions":
                      return (
                        <HomeQuickActions
                          key={block.id}
                          items={previewQuickActions}
                          onItemClick={(item) => toast.info(`Atalho clicado: ${item.title}`)}
                        />
                      );

                    case "banners":
                      return (
                        <EnhancedBannerRenderer
                          key={block.id}
                          banners={previewBanners}
                          onBannerAction={(b) => toast.info(`Ação do banner: ${b.title}`)}
                        />
                      );

                    case "stats_metrics":
                      return (
                        <div key={block.id} className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-border bg-card p-3">
                            <span className="text-[10px] text-muted-foreground">Volume no mês</span>
                            <p className="text-sm font-bold text-foreground mt-0.5">
                              {previewProfile === "diamond" ? "340" : "42"} {currentNiche.terms.metricShort}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                            <span className="text-[10px] text-muted-foreground">Economizado</span>
                            <p className="text-sm font-bold text-primary mt-0.5">
                              {previewProfile === "diamond" ? formatBRL(51.0) : formatBRL(6.3)}
                            </p>
                          </div>
                        </div>
                      );

                    case "video":
                      return settings.video.enabled ? (
                        <HomeVideoPlayer key={block.id} video={settings.video} />
                      ) : null;

                    case "instagram":
                      return settings.instagram.enabled ? (
                        <HomeInstagramCard key={block.id} instagram={settings.instagram} />
                      ) : null;

                    case "active_campaigns":
                      return (
                        <div key={block.id} className="rounded-2xl border border-border bg-card p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Flame className="h-3.5 w-3.5 text-emerald-500" />
                            <h4 className="text-xs font-bold">Promoção Ativa</h4>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Super Quarta: +R$ 0,25/{currentNiche.terms.metricShort} em consumos acima de R$ 100
                          </p>
                        </div>
                      );

                    case "gamification_tiers":
                      return (
                        <div key={block.id} className="rounded-2xl border border-border bg-card p-3">
                          <h4 className="text-xs font-bold mb-1.5">Níveis do Programa</h4>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Bronze</span>
                              <span>R$ 0,05/{currentNiche.terms.metricShort}</span>
                            </div>
                            <div className="flex justify-between font-bold text-primary">
                              <span>Diamante</span>
                              <span>R$ 0,15/{currentNiche.terms.metricShort}</span>
                            </div>
                          </div>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Pop-up Modal if triggered */}
      {testPopupOpen && currentBanner && (
        <HomePopupBanner banner={currentBanner} onClose={() => setTestPopupOpen(false)} />
      )}

      {/* Test Fullscreen Modal if triggered */}
      {testFullscreenOpen && currentBanner && (
        <HomeFullscreenBanner banner={currentBanner} onClose={() => setTestFullscreenOpen(false)} />
      )}
    </div>
  );
}
