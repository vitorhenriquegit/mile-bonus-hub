import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, RefreshCw, ShieldCheck, Copy, Loader2, Flame, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createFuelToken, getMyActiveToken, getMyOverview, getTiers, getActiveCustomerCampaigns } from "@/lib/loyalty.functions";
import { formatBRL, maskCpf, tierFor, type Tier } from "@/lib/loyalty";
import { useNiche } from "@/lib/niche-context";

export const Route = createFileRoute("/_authenticated/app/token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Token de abastecimento — FuelRewards" },
      { name: "description", content: "Gere um código seguro de 6 dígitos e receba o desconto direto na bomba." },
      { property: "og:title", content: "Token de abastecimento — FuelRewards" },
      { property: "og:description", content: "Gere um código seguro de 6 dígitos e receba o desconto direto na bomba." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TokenScreen,
});

function TokenScreen() {
  const { currentNiche } = useNiche();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeTokenFn = useServerFn(getMyActiveToken);
  const createTokenFn = useServerFn(createFuelToken);
  const overviewFn = useServerFn(getMyOverview);
  const tiersFn = useServerFn(getTiers);
  const campaignsFn = useServerFn(getActiveCustomerCampaigns);
  const [now, setNow] = useState(() => Date.now());

  const tokenQuery = useQuery({ queryKey: ["active-token"], queryFn: () => activeTokenFn({}) });
  const overview = useQuery({ queryKey: ["my-overview"], queryFn: () => overviewFn({}) });
  const tiersQuery = useQuery({ queryKey: ["tiers"], queryFn: () => tiersFn({}) });
  const campaignsQuery = useQuery({ queryKey: ["customer-campaigns"], queryFn: () => campaignsFn({}) });

  const createToken = useMutation({
    mutationFn: () => createTokenFn({}),
    onSuccess: (data) => {
      queryClient.setQueryData(["active-token"], data);
      setNow(Date.now());
    },
    onError: () => toast.error("Não foi possível gerar o token. Tente novamente."),
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const token = tokenQuery.data;
  const expiresAt = token ? new Date(token.expires_at).getTime() : 0;
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const expired = !token || remaining <= 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = Math.min(100, (remaining / 120) * 100);

  const tiers = (tiersQuery.data ?? []) as unknown as Tier[];
  const { current } = tierFor(overview.data?.volumeMonth ?? 0, tiers);
  const code = token?.code ? `${token.code.slice(0, 3)} ${token.code.slice(3)}` : "— — —";

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">Token de {currentNiche.terms.brandFallback}</span>
        <div className="w-10" />
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <ShieldCheck className="h-3.5 w-3.5" />
          Código seguro e único
        </div>

        <p className="mt-6 text-sm text-muted-foreground">Seu código dinâmico</p>
        <div
          className={`mt-3 select-all font-mono text-6xl font-black tracking-[0.1em] tabular-nums ${
            expired ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {tokenQuery.isLoading ? <Loader2 className="h-10 w-10 animate-spin" /> : code}
        </div>

        {token && !expired && (
          <button
            onClick={() => {
              navigator.clipboard?.writeText(token.code);
              toast.success("Código copiado");
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar código
          </button>
        )}

        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${expired ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p
            className={`font-mono text-sm font-semibold tabular-nums ${
              expired ? "text-destructive" : "text-foreground"
            }`}
          >
            {expired ? "Nenhum código ativo" : `Expira em ${mm}:${ss}`}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Instruções</p>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Informe ao <b className="text-foreground">{currentNiche.terms.operatorLabel.toLowerCase()}</b> o seu{" "}
          <b className="text-foreground">CPF</b> e este <b className="text-foreground">código de 6 dígitos</b> ao
          iniciar seu atendimento no(a) <b className="text-foreground">{currentNiche.terms.locationLabel}</b>. O desconto
          será aplicado na hora.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3">
          <div>
            <p className="text-xs text-muted-foreground">CPF</p>
            <p className="font-mono text-sm font-semibold">{maskCpf(overview.data?.profile?.cpf)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Desconto do Nível</p>
            <p className="text-sm font-semibold text-primary">{formatBRL(current.discount_per_liter)}/{currentNiche.terms.metricShort}</p>
          </div>
        </div>
      </div>

      {/* Alerta de Campanhas Promocionais Hoje */}
      {campaignsQuery.data && campaignsQuery.data.some((c: any) => c.isTodayActive) && (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-card p-4 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 mt-0.5 shadow-xs">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[10px]">
                🔥 Desconto Turbinado Hoje!
              </span>
              {campaignsQuery.data
                .filter((c: any) => c.isTodayActive)
                .slice(0, 1)
                .map((camp: any) => (
                  <div key={camp.id} className="mt-0.5">
                    <p className="font-bold text-foreground text-xs">{camp.title}</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Consumo a partir de <b>{formatBRL(camp.minFuelAmount)}</b> para somar{" "}
                      <b className="text-emerald-600 dark:text-emerald-400">
                        +{camp.discountType === "per_liter" ? formatBRL(camp.discountValue) + "/" + currentNiche.terms.metricShort : camp.discountValue + "%"}
                      </b>{" "}
                      ao seu desconto de nível!
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => createToken.mutate()}
        disabled={createToken.isPending}
        className="mt-auto mb-28 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {createToken.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {expired ? "Gerar novo código" : "Renovar código"}
      </button>
    </div>
  );
}
