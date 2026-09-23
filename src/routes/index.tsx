import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Smartphone,
  Monitor,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { NICHES, type NicheId, type NicheConfig } from "@/lib/niche";
import { NicheIcon } from "@/components/NicheIcon";
import { useNiche } from "@/lib/niche-context";
import { formatBRL } from "@/lib/loyalty";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fidelidade Multi-Nicho — Plataforma White-Label" },
      {
        name: "description",
        content:
          "Plataforma de fidelidade e gamificação para Oficinas, Estética Automotiva, Gastronomia, Varejo e Postos.",
      },
      { property: "og:title", content: "Fidelidade Multi-Nicho — Plataforma White-Label" },
      {
        property: "og:description",
        content:
          "Gamificação por consumo, desconto no PDV e aumento comprovado de ticket médio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { currentNiche, setNicheId } = useNiche();
  const [activeTab, setActiveTab] = useState<NicheId>(currentNiche.id);

  const selectedNiche: NicheConfig = NICHES[activeTab] || currentNiche;
  const uplift = Math.round(
    ((selectedNiche.terms.ticketBenchmarkApp - selectedNiche.terms.ticketBenchmarkNoApp) /
      selectedNiche.terms.ticketBenchmarkNoApp) *
      100,
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
            <NicheIcon name={selectedNiche.iconName} className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight leading-none block">
              {selectedNiche.terms.brandFallback}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Plataforma Multi-Nicho
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            to="/auth"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90 transition"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            1 Plataforma · 5 Nichos de Mercado Prontos
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Fidelidade e gamificação que seu cliente{" "}
            <span className="text-primary">sente no bolso</span>.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg leading-relaxed">
            Arquitetura white-label flexível desenhada para atender Oficinas Mecânicas,
            Estética Automotiva, Gastronomia, Lojas em Geral e Postos de Combustíveis. Eleve
            o ticket médio, automatize a validação no PDV via token seguro e engaje sua base.
          </p>
        </div>

        {/* Seletor Visual Interativo de Nichos */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Simule a plataforma no seu nicho:
            </span>
            <span className="text-xs text-primary font-medium hidden sm:inline">
              Clique em um segmento para visualizar o vocabulário e métricas adaptados
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.values(NICHES) as NicheConfig[]).map((n) => {
              const isActive = activeTab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setActiveTab(n.id);
                    setNicheId(n.id);
                  }}
                  className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                    isActive
                      ? "border-primary bg-primary/10 shadow-card ring-2 ring-primary"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-lg ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <NicheIcon name={n.iconName} className="h-4 w-4" />
                  </div>
                  <strong className="mt-2 text-xs font-bold leading-tight line-clamp-1 text-foreground">
                    {n.badge}
                  </strong>
                  <span className="mt-0.5 text-[10px] text-muted-foreground truncate w-full">
                    {n.terms.metricLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Destaque do Nicho Selecionado */}
          <div className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {selectedNiche.badge} · Preset Ativo
                </span>
                <h3 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                  {selectedNiche.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xl">
                  {selectedNiche.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    Aumento de Ticket
                  </p>
                  <p className="text-base font-black">+{uplift}% com fidelidade</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 backdrop-blur">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Unidade / Transação
                </span>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {selectedNiche.terms.transactionSingular}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Local: {selectedNiche.terms.locationLabel}
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 backdrop-blur">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Operador no PDV
                </span>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {selectedNiche.terms.operatorLabel}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedNiche.terms.terminalLabel}
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 backdrop-blur">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Ticket Médio
                </span>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatBRL(selectedNiche.terms.ticketBenchmarkApp)} vs {formatBRL(selectedNiche.terms.ticketBenchmarkNoApp)}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  +{formatBRL(selectedNiche.terms.ticketBenchmarkApp - selectedNiche.terms.ticketBenchmarkNoApp)} por visita
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 backdrop-blur">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Regra de Fidelidade
                </span>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {selectedNiche.terms.rewardTypeLabel}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  4 Tiers com Gamificação
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Acesso aos Ambientes */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <Link
            to="/app"
            className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Smartphone className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-bold">App do {selectedNiche.terms.clientLabel}</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Interface mobile dinâmica com nível de qualificação, {selectedNiche.terms.rewardTypeLabel.toLowerCase()},
              geração de token de 6 dígitos e promoções vigentes.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:underline">
              Abrir app do cliente <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-foreground text-background shadow-sm">
              <Monitor className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Painel do Gestor Multi-Nicho</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Visão de faturamento incremental, comparativo de ticket médio com e sem app,
              validação de token para {selectedNiche.terms.operatorLabel.toLowerCase()} e troca de nicho com 1 clique.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:underline">
              Acessar painel do gestor <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}

