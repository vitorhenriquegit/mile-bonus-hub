import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Layers,
  Plus,
  Trash2,
  Save,
  Loader2,
  Eye,
  Coffee,
  Wrench,
  Droplets,
  Sparkles,
  Fuel,
  Gift,
  Tag,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  CheckCircle2,
  Smartphone,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { getAllBanners, saveBanners } from "@/lib/loyalty.functions";
import { DEFAULT_BANNERS, type PromotionalBanner } from "@/lib/loyalty";
import { HomeBannerSlider } from "@/components/HomeBannerSlider";

export const Route = createFileRoute("/_authenticated/dashboard/banners")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Banners & Promoções — FuelRewards Gestor" },
      { name: "description", content: "Gerencie banners promocionais da conveniência, troca de óleo e serviços exibidos na tela inicial do app." },
      { property: "og:title", content: "Banners & Promoções — FuelRewards Gestor" },
      { property: "og:description", content: "Gerencie banners promocionais do app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardBannersPage,
});

function DashboardBannersPage() {
  const queryClient = useQueryClient();
  const getBannersFn = useServerFn(getAllBanners);
  const saveBannersFn = useServerFn(saveBanners);

  const bannersQuery = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => getBannersFn({}),
  });

  const [banners, setBanners] = useState<PromotionalBanner[]>(DEFAULT_BANNERS);
  const [selectedBannerIndex, setSelectedBannerIndex] = useState<number>(0);

  useEffect(() => {
    if (bannersQuery.data && bannersQuery.data.length > 0) {
      setBanners(bannersQuery.data);
    }
  }, [bannersQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (newBanners: PromotionalBanner[]) => saveBannersFn({ data: newBanners }),
    onSuccess: () => {
      toast.success("Banners promocionais salvos com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["customer-banners"] });
    },
    onError: () => toast.error("Erro ao salvar banners."),
  });

  const handleAddBanner = () => {
    const newId = `banner-${Date.now()}`;
    const newBanner: PromotionalBanner = {
      id: newId,
      title: "Nova Promoção ou Destaque",
      subtitle: "Aproveite esta oferta exclusiva do posto para motoristas",
      badge: "DESTAQUE",
      badgeColor: "amber",
      theme: "amber",
      icon: "tag",
      actionLabel: "Ver Detalhes",
      actionType: "modal",
      modalDetails: {
        description: "Detalhes completos da promoção que você deseja divulgar aos seus clientes.",
        rules: ["Apresente o app no caixa", "Válido enquanto durarem os estoques"],
        validUntil: "Válido este mês",
      },
      active: true,
      sortOrder: banners.length + 1,
    };

    const updated = [...banners, newBanner];
    setBanners(updated);
    setSelectedBannerIndex(updated.length - 1);
  };

  const handleRemoveBanner = (index: number) => {
    if (banners.length <= 1) {
      toast.error("Você deve manter pelo menos 1 banner cadastrado.");
      return;
    }
    const updated = banners.filter((_, i) => i !== index);
    setBanners(updated);
    if (selectedBannerIndex >= updated.length) {
      setSelectedBannerIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleUpdateBanner = (index: number, patch: Partial<PromotionalBanner>) => {
    setBanners(banners.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const list = [...banners];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Recalcula sortOrder
    const reordered = list.map((b, idx) => ({ ...b, sortOrder: idx + 1 }));
    setBanners(reordered);
    setSelectedBannerIndex(targetIndex);
  };

  const activeBanner = banners[selectedBannerIndex] || banners[0];

  if (bannersQuery.isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners Promocionais da Tela Inicial</h1>
          <p className="text-sm text-muted-foreground">
            Promova qualquer produto ou serviço do posto: Loja de Conveniência, Troca de Óleo, Lavagem, Roleta e Avisos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddBanner}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Novo Banner
          </button>
          <button
            onClick={() => saveMutation.mutate(banners)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Banners</p>
              <p className="text-xl font-bold tabular-nums">{banners.length} cadastrados</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ativos no App</p>
              <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {banners.filter((b) => b.active).length} ativos
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Visualização</p>
              <p className="text-xl font-bold">Carrossel Rotativo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Banner List & Editor, Right = Phone Live Preview */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left Column: Banner List & Form Editor */}
        <div className="xl:col-span-7 space-y-6">
          {/* Banner Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {banners.map((b, idx) => (
              <button
                key={b.id || idx}
                onClick={() => setSelectedBannerIndex(idx)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                  idx === selectedBannerIndex
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>#{idx + 1}</span>
                <span className="truncate max-w-[130px]">{b.badge || b.title}</span>
                {!b.active && <span className="text-[10px] opacity-70">(Pausado)</span>}
              </button>
            ))}
          </div>

          {/* Editor Form for Selected Banner */}
          {activeBanner && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-xs font-bold">
                    #{selectedBannerIndex + 1}
                  </span>
                  <h2 className="text-base font-bold">Editar Banner</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMove(selectedBannerIndex, "up")}
                    disabled={selectedBannerIndex === 0}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    title="Mover para cima"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMove(selectedBannerIndex, "down")}
                    disabled={selectedBannerIndex === banners.length - 1}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveBanner(selectedBannerIndex)}
                    className="rounded-lg border border-red-500/20 p-1.5 text-red-500 hover:bg-red-500/10"
                    title="Excluir banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status Toggle & Theme Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Status do Banner</label>
                  <label className="mt-2 flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeBanner.active}
                      onChange={(e) => handleUpdateBanner(selectedBannerIndex, { active: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-semibold">
                      {activeBanner.active ? "Ativo (Exibindo no App)" : "Pausado (Oculto no App)"}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tema de Cor / Gradiente</label>
                  <select
                    value={activeBanner.theme}
                    onChange={(e) =>
                      handleUpdateBanner(selectedBannerIndex, {
                        theme: e.target.value as PromotionalBanner["theme"],
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                  >
                    <option value="amber">Âmbar & Ouro (Conveniência & Padaria)</option>
                    <option value="emerald">Esmeralda & Verde (Troca de Óleo & Ecológico)</option>
                    <option value="blue">Safira & Azul (Ducha & Lavagem)</option>
                    <option value="purple">Púrpura & Violeta (Roleta & Prêmios)</option>
                    <option value="rose">Rubi & Rosa (Ofertas Especiais)</option>
                    <option value="dark">Dark Titanium (Combustíveis Premium)</option>
                  </select>
                </div>
              </div>

              {/* Badge & Icon */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tag / Badge Chamativa</label>
                  <input
                    type="text"
                    value={activeBanner.badge}
                    onChange={(e) => handleUpdateBanner(selectedBannerIndex, { badge: e.target.value })}
                    placeholder="Ex: CONVENIÊNCIA 24H, PIT STOP"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ícone Ilustrativo</label>
                  <select
                    value={activeBanner.icon}
                    onChange={(e) =>
                      handleUpdateBanner(selectedBannerIndex, {
                        icon: e.target.value as PromotionalBanner["icon"],
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                  >
                    <option value="coffee">☕ Café / Conveniência</option>
                    <option value="wrench">🔧 Ferramenta / Troca de Óleo</option>
                    <option value="droplets">💧 Gotas / Ducha & Lavagem</option>
                    <option value="sparkles">✨ Brilhos / Roleta & Sorte</option>
                    <option value="fuel">⛽ Combustível / Aditivada</option>
                    <option value="gift">🎁 Presente / Brindes</option>
                    <option value="tag">🏷️ Etiqueta / Desconto Geral</option>
                  </select>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Título Principal do Banner</label>
                  <input
                    type="text"
                    value={activeBanner.title}
                    onChange={(e) => handleUpdateBanner(selectedBannerIndex, { title: e.target.value })}
                    placeholder="Ex: Combo Café + Pão de Queijo na Estufa"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subtítulo / Benefício</label>
                  <textarea
                    rows={2}
                    value={activeBanner.subtitle}
                    onChange={(e) => handleUpdateBanner(selectedBannerIndex, { subtitle: e.target.value })}
                    placeholder="Ex: Aqueça sua parada na conveniência por apenas R$ 9,90"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* CTA Action Configuration */}
              <div className="grid gap-4 sm:grid-cols-2 border-t border-border/50 pt-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Texto do Botão (CTA)</label>
                  <input
                    type="text"
                    value={activeBanner.actionLabel}
                    onChange={(e) => handleUpdateBanner(selectedBannerIndex, { actionLabel: e.target.value })}
                    placeholder="Ex: Ver Detalhes, Abastecer Agora"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ação ao Clicar</label>
                  <select
                    value={activeBanner.actionType}
                    onChange={(e) =>
                      handleUpdateBanner(selectedBannerIndex, {
                        actionType: e.target.value as PromotionalBanner["actionType"],
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                  >
                    <option value="modal">Abrir Detalhes / Regras da Promoção</option>
                    <option value="token">Ir para Gerador de Token (Abastecer)</option>
                    <option value="roleta">Ir para a Roleta da Sorte</option>
                    <option value="ofertas">Ir para a Lista de Campanhas</option>
                    <option value="external">Abrir Link Externo / WhatsApp</option>
                  </select>
                </div>
              </div>

              {/* External URL if actionType === 'external' */}
              {activeBanner.actionType === "external" && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">URL ou Link de WhatsApp</label>
                  <input
                    type="url"
                    value={activeBanner.actionUrl || ""}
                    onChange={(e) => handleUpdateBanner(selectedBannerIndex, { actionUrl: e.target.value })}
                    placeholder="https://wa.me/5511999999999 ou https://seuposto.com.br"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                  />
                </div>
              )}

              {/* Modal Rules if actionType === 'modal' */}
              {activeBanner.actionType === "modal" && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-primary" /> Conteúdo do Modal Informativo:
                  </p>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Descrição Completa</label>
                    <textarea
                      rows={2}
                      value={activeBanner.modalDetails?.description || ""}
                      onChange={(e) =>
                        handleUpdateBanner(selectedBannerIndex, {
                          modalDetails: {
                            ...activeBanner.modalDetails,
                            description: e.target.value,
                            rules: activeBanner.modalDetails?.rules || [],
                          },
                        })
                      }
                      placeholder="Explicação detalhada da oferta para o cliente..."
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Validade / Horário</label>
                    <input
                      type="text"
                      value={activeBanner.modalDetails?.validUntil || ""}
                      onChange={(e) =>
                        handleUpdateBanner(selectedBannerIndex, {
                          modalDetails: {
                            ...activeBanner.modalDetails,
                            description: activeBanner.modalDetails?.description || "",
                            rules: activeBanner.modalDetails?.rules || [],
                            validUntil: e.target.value,
                          },
                        })
                      }
                      placeholder="Ex: Válido até o fim do mês"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Smartphone Preview */}
        <div className="xl:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] sticky top-20 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                <Smartphone className="h-4 w-4" /> Prévia ao Vivo no App
              </span>
              <span className="text-[11px] text-muted-foreground">Atualizado em tempo real</span>
            </div>

            {/* Phone Mockup Frame */}
            <div className="rounded-[40px] border-[6px] border-slate-900 bg-background p-4 shadow-2xl space-y-4 overflow-hidden relative">
              {/* Speaker / Notch */}
              <div className="mx-auto h-4 w-28 rounded-full bg-slate-900" />

              {/* App Mock Header */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[10px] text-muted-foreground">Olá,</p>
                  <p className="text-xs font-bold">Motorista Exemplo</p>
                </div>
                <div className="h-6 w-6 rounded-full bg-accent grid place-items-center text-[10px] font-bold">
                  🔔
                </div>
              </div>

              {/* The Live Carousel Preview! */}
              <div className="pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Vitrine de Banners do Posto
                </p>
                <HomeBannerSlider banners={banners.filter((b) => b.active)} />
              </div>

              {/* Mock Tier Card below */}
              <div
                className="rounded-2xl p-3.5 text-white shadow-xs"
                style={{ background: "var(--gradient-tier-gold)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase opacity-90">Nível Atual</span>
                  <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full">OURO</span>
                </div>
                <p className="mt-1 text-lg font-black tracking-tight">R$ 0,10 / litro</p>
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="mx-auto h-1 w-20 rounded-full bg-slate-700/50 mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
