import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Fuel, Zap, TrendingUp } from "lucide-react";
import { CURRENT_USER, TIERS, formatBRL, tierFor } from "@/lib/mock";

export const Route = createFileRoute("/app/")({
  component: HomeScreen,
});

function HomeScreen() {
  const navigate = useNavigate();
  const { current, next, isMax } = tierFor(CURRENT_USER.volumeMonth);
  const litersToNext = Math.max(0, next.min - CURRENT_USER.volumeMonth);
  const span = next.min - current.min || 1;
  const progress = Math.min(
    100,
    Math.round(((CURRENT_USER.volumeMonth - current.min) / span) * 100),
  );

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Olá,</p>
            <p className="truncate text-sm font-semibold">{CURRENT_USER.name}</p>
          </div>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground">
          <Bell className="h-5 w-5" />
        </button>
      </div>

      {/* Tier card */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-float"
        style={{ background: "var(--gradient-tier-gold)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-90">
              Seu nível
            </p>
            <p className="mt-1 text-2xl font-bold">Nível {current.name}</p>
          </div>
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur"
            aria-hidden
          >
            <Zap className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <p className="text-xs opacity-90">Seu desconto agora</p>
          <p className="mt-1 text-3xl font-black tracking-tight">
            {formatBRL(current.discount)}
            <span className="ml-1 text-base font-semibold opacity-90">/litro</span>
          </p>
        </div>

        {!isMax ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span>
                Faltam <b>{litersToNext}L</b> para {next.name}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs opacity-90">
              No próximo nível você ganha <b>{formatBRL(next.discount)}/L</b>
            </p>
          </div>
        ) : (
          <p className="mt-5 text-xs font-medium opacity-90">
            Você está no nível máximo. Continue abastecendo!
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Volume no mês"
          value={`${CURRENT_USER.volumeMonth}L`}
          icon={<Fuel className="h-4 w-4" />}
        />
        <StatCard
          label="Economizado"
          value={formatBRL(CURRENT_USER.volumeMonth * current.discount)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent
        />
      </div>

      {/* Tiers preview */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Próximos níveis</p>
        <ul className="mt-3 space-y-2">
          {TIERS.map((t) => {
            const isCurrent = t.name === current.name;
            return (
              <li
                key={t.name}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  isCurrent ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: `var(--${t.color})` }}
                  />
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.min}–{t.max === 9999 ? "∞" : t.max}L
                  </span>
                </div>
                <span className="font-semibold text-primary">
                  {formatBRL(t.discount)}/L
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* CTA */}
      <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-md px-5">
        <button
          onClick={() => navigate({ to: "/app/token" })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-float active:scale-[0.99]"
        >
          <Zap className="h-5 w-5" />
          Abastecer com desconto
        </button>
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
      className={`rounded-2xl border p-3 ${
        accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}
