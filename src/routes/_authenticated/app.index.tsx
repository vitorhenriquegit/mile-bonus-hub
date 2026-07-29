import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Fuel, Zap, TrendingUp, Loader2 } from "lucide-react";
import { getMyOverview, getTiers } from "@/lib/loyalty.functions";
import { formatBRL, tierFor, type Tier } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/app/")({
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
  const overviewFn = useServerFn(getMyOverview);
  const tiersFn = useServerFn(getTiers);

  const overview = useQuery({ queryKey: ["my-overview"], queryFn: () => overviewFn({}) });
  const tiersQuery = useQuery({ queryKey: ["tiers"], queryFn: () => tiersFn({}) });

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
  const litersToNext = Math.max(0, next.min_liters - volume);
  const span = next.min_liters - current.min_liters || 1;
  const progress = Math.min(100, Math.max(0, Math.round(((volume - current.min_liters) / span) * 100)));

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
        style={{ background: "var(--gradient-tier-gold)" }}
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

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Volume no mês" value={`${volume.toFixed(0)}L`} icon={<Fuel className="h-4 w-4" />} />
        <StatCard label="Economizado" value={formatBRL(saved)} icon={<TrendingUp className="h-4 w-4" />} accent />
      </div>

      <Link
        to="/app/token"
        className="rounded-2xl bg-primary px-5 py-4 text-center text-sm font-semibold text-primary-foreground shadow-float"
      >
        Gerar token de abastecimento
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
