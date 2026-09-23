import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Fuel, Zap, TrendingUp, Loader2, Sparkles, Gift, Flame, ArrowRight } from "lucide-react";
import { getMyOverview, getTiers, getActiveCustomerCampaigns, getActiveCustomerBanners } from "@/lib/loyalty.functions";
import { formatBRL, tierFor, type Tier, type PromotionalBanner } from "@/lib/loyalty";
import { HomeBannerSlider } from "@/components/HomeBannerSlider";

export const Route = createFileRoute("/_authenticated/app/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Meu nível — FuelRewards" },
      { name: "description", content: "Veja seu nível, desconto por litro e volume abastecido no mês." },
      { property: "og:title", content: "Meu nível — FuelRewards" },
      { property: "og:description", content: "Veja seu nível, desconto por litro e volume abastecido no mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeScreen,
});

function HomeScreen() {
  const navigate = useNavigate();
  const overviewFn = useServerFn(getMyOverview);
  const tiersFn = useServerFn(getTiers);
  const campaignsFn = useServerFn(getActiveCustomerCampaigns);
  const bannersFn = useServerFn(getActiveCustomerBanners);

  const overview = useQuery({ queryKey: ["my-overview"], queryFn: () => overviewFn({}) });
  const tiersQuery = useQuery({ queryKey: ["tiers"], queryFn: () => tiersFn({}) });
  const campaignsQuery = useQuery({ queryKey: ["customer-campaigns"], queryFn: () => campaignsFn({}) });
  const bannersQuery = useQuery({ queryKey: ["customer-banners"], queryFn: () => bannersFn({}) });

  if (overview.isLoading || tiersQuery.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const tiers = (tiersQuery.data ?? []) as unknown as Tier[];
  const volume = overview.data?.volumeMonth ?? 0;
  const saved = overview.data?.savedMonth ?? 0;
  const firstName = (overview.data?.profile?.full_name || "Motorista").split(" ")[0];
  const { current, next, isMax } = tierFor(volume, tiers);
  const nextMinLiters = next?.min_liters ?? 50;
  const currentMinLiters = current?.min_liters ?? 0;
  const litersToNext = Math.max(0, nextMinLiters - volume);
  const span = Math.max(1, nextMinLiters - currentMinLiters);
  const progress = Math.min(100, Math.max(0, Math.round(((volume - currentMinLiters) / span) * 100)));

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Olá,</p>
            <p className="truncate text-sm font-semibold">{firstName}</p>
          </div>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground">
          <Bell className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-float"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-90">Seu nível</p>
            <p className="mt-1 text-2xl font-bold">Nível {current.name}</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur" aria-hidden>
            <Zap className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <p className="text-xs opacity-90">Seu desconto agora</p>
          <p className="mt-1 text-3xl font-black tracking-tight">
            {formatBRL(current.discount_per_liter)}
            <span className="ml-1 text-base font-semibold opacity-90">/litro</span>
          </p>
        </div>

        {!isMax ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span>
                Faltam <b>{litersToNext.toFixed(0)}L</b> para {next.name}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs opacity-90">
              No próximo nível você ganha <b>{formatBRL(next.discount_per_liter)}/L</b>
            </p>
          </div>
        ) : (
          <p className="mt-5 text-xs font-medium opacity-90">
            Você está no nível máximo. Continue abastecendo!
          </p>
        )}
      </div>

      {/* Banners Promocionais & Destaques do Posto */}
      {bannersQuery.data && bannersQuery.data.length > 0 && (
        <div className="space-y-1.5">
          <HomeBannerSlider banners={bannersQuery.data} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Volume no mês" value={`${volume.toFixed(0)}L`} icon={<Fuel className="h-4 w-4" />} />
        <StatCard label="Economizado" value={formatBRL(saved)} icon={<TrendingUp className="h-4 w-4" />} accent />
      </div>

      {/* Campanhas Promocionais Vigentes */}
      {campaignsQuery.data && campaignsQuery.data.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-foreground">Campanhas & Descontos</h2>
            </div>
            <Link to="/app/ofertas" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {campaignsQuery.data.slice(0, 2).map((camp: any) => {
              const isToday = camp.isTodayActive;
              const discountText =
                camp.discountType === "per_liter"
                  ? `+${formatBRL(camp.discountValue)}/L`
                  : `${camp.discountValue}% OFF`;

              return (
                <div
                  key={camp.id}
                  className={`relative overflow-hidden rounded-2xl border p-4 shadow-card transition ${
                    isToday
                      ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-card"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {isToday ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Válido Hoje!
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Dias Selecionados
                      </span>
                    )}
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                      {discountText}
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-sm font-bold text-foreground leading-snug">{camp.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{camp.description}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                    <span className="text-xs text-muted-foreground">
                      Mínimo: <strong className="text-foreground">{camp.minFuelAmount > 0 ? formatBRL(camp.minFuelAmount) : "Livre"}</strong>
                    </span>

                    <button
                      onClick={() => navigate({ to: "/app/ofertas" })}
                      className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                    >
                      <Zap className="h-3 w-3" />
                      {camp.minFuelAmount > 0 ? `Abastecer ${formatBRL(camp.minFuelAmount)}` : "Abastecer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link
        to="/app/token"
        className="rounded-2xl bg-primary px-5 py-4 text-center text-sm font-semibold text-primary-foreground shadow-float"
      >
        Gerar token de abastecimento
      </Link>

      {/* Lucky Wheel Promo Card */}
      <Link
        to="/app/roleta"
        className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 shadow-card transition hover:scale-[1.01]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Roleta da Sorte
            </p>
            <p className="text-sm font-bold">Gire e ganhe prêmios hoje!</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Girar →</span>
      </Link>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Níveis do programa</p>
        <ul className="mt-3 space-y-2">
          {tiers.map((t) => {
            const isCurrent = t.name === current.name;
            return (
              <li
                key={t.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${isCurrent ? "bg-accent" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--${t.color})` }} />
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.min_liters}–{t.max_liters >= 9999 ? "∞" : t.max_liters}L
                  </span>
                </div>
                <span className="font-semibold text-primary">{formatBRL(t.discount_per_liter)}/L</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`mt-1.5 text-lg font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
