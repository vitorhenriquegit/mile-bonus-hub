import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Fuel, ShieldCheck, CheckCircle2, Loader2, RefreshCw, Zap, Flame, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { lookupCustomerToken, registerFueling, getStations, getActiveCustomerCampaigns } from "@/lib/loyalty.functions";
import { formatBRL, maskCpf, tierFor, type Tier } from "@/lib/loyalty";

export function AttendantTerminal({
  onSuccess,
  defaultStationId,
}: {
  onSuccess?: () => void;
  defaultStationId?: string;
}) {
  const queryClient = useQueryClient();
  const lookupFn = useServerFn(lookupCustomerToken);
  const registerFn = useServerFn(registerFueling);
  const stationsFn = useServerFn(getStations);
  const campaignsFn = useServerFn(getActiveCustomerCampaigns);

  const [queryInput, setQueryInput] = useState("");
  const [selectedStation, setSelectedStation] = useState(defaultStationId || "");
  const [fuelType, setFuelType] = useState("Gasolina Comum");
  const [pricePerLiter, setPricePerLiter] = useState("5.89");
  const [litersInput, setLitersInput] = useState("");

  const stationsQuery = useQuery({ queryKey: ["stations"], queryFn: () => stationsFn({}) });
  const campaignsQuery = useQuery({ queryKey: ["customer-campaigns"], queryFn: () => campaignsFn({}) });

  const lookupMutation = useMutation({
    mutationFn: (search: string) => lookupFn({ data: { query: search } }),
    onError: (err: any) => {
      toast.error(err.message || "Token ou CPF não encontrado.");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (params: {
      userId: string;
      tokenId?: string;
      stationId?: string;
      fuelType: string;
      liters: number;
      pricePerLiter: number;
    }) => registerFn({ data: params }),
    onSuccess: (data: any) => {
      if (data.appliedCampaign) {
        toast.success(
          `🎉 Promoção "${data.appliedCampaign.title}" aplicada! Desconto de ${formatBRL(data.discountPerLiter)}/L concedido. Economia total: ${formatBRL(data.discountTotal)}.`,
        );
      } else {
        toast.success(
          `Abastecimento registrado com sucesso! Economia de ${formatBRL(data.discountTotal)} no abastecimento.`,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["my-overview"] });
      queryClient.invalidateQueries({ queryKey: ["my-fuelings"] });
      handleReset();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao registrar abastecimento.");
    },
  });

  const handleReset = () => {
    lookupMutation.reset();
    setQueryInput("");
    setLitersInput("");
  };

  const lookupData = lookupMutation.data;
  const tiers = (lookupData?.tiers ?? []) as unknown as Tier[];
  const volumeMonth = lookupData?.volumeMonth ?? 0;
  const currentTier = lookupData ? tierFor(volumeMonth, tiers).current : null;

  const liters = parseFloat(litersInput.replace(",", ".")) || 0;
  const unitPrice = parseFloat(pricePerLiter.replace(",", ".")) || 0;
  const originalTotal = Math.round(liters * unitPrice * 100) / 100;

  // Lógica de Enquadramento em Campanhas Promocionais Sazonais
  const activeCampaigns = (campaignsQuery.data || []) as any[];
  const todayDay = new Date().getDay();
  const fuelSlug = fuelType.toLowerCase().replace(/\s+/g, "_");

  const eligibleCampaigns = activeCampaigns.filter((c: any) => {
    if (!c.daysOfWeek?.includes(todayDay)) return false;
    if (c.fuelTypes && c.fuelTypes.length > 0) {
      const match = c.fuelTypes.some(
        (f: string) => fuelSlug.includes(f) || f.includes(fuelSlug) || fuelType.toLowerCase().includes(f),
      );
      if (!match) return false;
    }
    return true;
  });

  const matchedCampaign = eligibleCampaigns.find((c: any) => originalTotal >= c.minFuelAmount);
  const almostCampaign = !matchedCampaign
    ? eligibleCampaigns.find(
        (c: any) =>
          c.minFuelAmount > 0 &&
          originalTotal > 0 &&
          originalTotal < c.minFuelAmount &&
          c.minFuelAmount - originalTotal <= 50,
      )
    : null;

  let promoDiscountPerLiter = 0;
  if (matchedCampaign) {
    if (matchedCampaign.discountType === "per_liter") {
      promoDiscountPerLiter = Number(matchedCampaign.discountValue || 0);
    } else {
      promoDiscountPerLiter =
        Math.round(((unitPrice * Number(matchedCampaign.discountValue || 0)) / 100) * 100) / 100;
    }
  }

  const tierDiscountPerLiter = currentTier?.discount_per_liter ?? 0;
  const totalDiscountPerLiter = tierDiscountPerLiter + promoDiscountPerLiter;
  const discountTotal = Math.round(liters * totalDiscountPerLiter * 100) / 100;
  const finalTotal = Math.max(0, Math.round((originalTotal - discountTotal) * 100) / 100);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    lookupMutation.mutate(queryInput.trim());
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupData || !lookupData.customer) return;
    if (liters <= 0) {
      toast.error("Informe um volume de litros válido.");
      return;
    }
    if (unitPrice <= 0) {
      toast.error("Informe o preço do litro válido.");
      return;
    }

    const stationId = selectedStation || defaultStationId || (stationsQuery.data?.[0]?.id ?? undefined);

    registerMutation.mutate({
      userId: lookupData.customer.id,
      tokenId: lookupData.token?.id,
      stationId,
      fuelType,
      liters,
      pricePerLiter: unitPrice,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-float">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Terminal do Frentista</h2>
            <p className="text-xs text-muted-foreground">Validação de Token e Registro Direto na Bomba</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <ShieldCheck className="h-3.5 w-3.5" /> PDV Ativo
        </span>
      </div>

      {!lookupData ? (
        <form onSubmit={handleSearchSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Token de 6 dígitos ou CPF do Cliente
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ex: 439 012 ou 123.456.789-00"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-base font-mono font-semibold placeholder:font-sans placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={lookupMutation.isPending || !queryInput.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90 disabled:opacity-50"
              >
                {lookupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Validar
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-accent/50 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">💡 Como funciona na pista:</p>
            <p className="mt-1">
              Peça ao cliente o <b>código de 6 dígitos</b> gerado no app ou informe o <b>CPF</b>. O sistema localiza o nível de fidelidade e calcula o desconto automático por litro.
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-5">
          {/* Customer Summary Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{lookupData.customer.full_name || "Cliente FuelRewards"}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    CPF: {maskCpf(lookupData.customer.cpf)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Galonagem no mês: <b>{volumeMonth.toFixed(1)}L</b>
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                <RefreshCw className="h-3 w-3" /> Outro cliente
              </button>
            </div>

            {/* Active Tier Discount Highlight */}
            {currentTier && (
              <div
                className="mt-4 flex items-center justify-between rounded-xl p-3 text-white shadow-card"
                style={{ background: `var(--${currentTier.color}, var(--gradient-tier-gold))` }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-90">Nível Atual</p>
                    <p className="text-base font-extrabold">{currentTier.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-90">Desconto Aplicado</p>
                  <p className="text-lg font-black">{formatBRL(currentTier.discount_per_liter)}/L</p>
                </div>
              </div>
            )}
          </div>

          {/* Fueling Form Fields */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Combustível</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Gasolina Comum">Gasolina Comum</option>
                <option value="Gasolina Aditivada">Gasolina Aditivada</option>
                <option value="Etanol">Etanol</option>
                <option value="Diesel S10">Diesel S10</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Preço Sem Desconto (R$/L)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={pricePerLiter}
                onChange={(e) => setPricePerLiter(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Litros Abastecidos</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Ex: 35.5"
                value={litersInput}
                onChange={(e) => setLitersInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {stationsQuery.data && stationsQuery.data.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Posto de Abastecimento</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {stationsQuery.data.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.city}/{st.state})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Alerta de Promoção Aplicada ou Oportunidade de Upsell */}
          {matchedCampaign && (
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-card p-4 shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                      🎉 Promoção Sazonal Aplicada!
                    </span>
                    <strong className="text-xs font-bold text-foreground">{matchedCampaign.title}</strong>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Abastecimento de <b>{formatBRL(originalTotal)}</b> se enquadra na regra (mínimo de {formatBRL(matchedCampaign.minFuelAmount)}).
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    Bônus Promocional Concedido: +{formatBRL(promoDiscountPerLiter)}/L acumulado com o nível {currentTier?.name}!
                  </p>
                </div>
              </div>
            </div>
          )}

          {almostCampaign && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-700 dark:text-blue-300">Dica de Pista para o Frentista:</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Faltam apenas <b>{formatBRL(almostCampaign.minFuelAmount - originalTotal)}</b> para este cliente ganhar <b>+{formatBRL(almostCampaign.discountValue)}/L</b> na promoção <b>"{almostCampaign.title}"</b>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Calculation Result */}
          {liters > 0 && (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Valor original ({liters.toFixed(1)}L × {formatBRL(unitPrice)})</span>
                <span className="line-through">{formatBRL(originalTotal)}</span>
              </div>

              {/* Detalhe do Nível */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Desconto Nível {currentTier?.name} ({formatBRL(tierDiscountPerLiter)}/L)</span>
                <span>−{formatBRL(liters * tierDiscountPerLiter)}</span>
              </div>

              {/* Detalhe da Promoção se houver */}
              {promoDiscountPerLiter > 0 && (
                <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" /> Bônus Promoção ({matchedCampaign?.title}) (+{formatBRL(promoDiscountPerLiter)}/L)
                  </span>
                  <span>−{formatBRL(liters * promoDiscountPerLiter)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 border-t border-border/40 pt-1.5">
                <span>Desconto Total na Bomba ({formatBRL(totalDiscountPerLiter)}/L)</span>
                <span>−{formatBRL(discountTotal)}</span>
              </div>

              <div className="border-t border-border pt-2 flex justify-between items-end">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Valor Final a Cobrar</p>
                  <p className="text-xs text-muted-foreground">Desconto aplicado na hora ao cliente</p>
                </div>
                <p className="text-2xl font-black text-foreground tabular-nums">{formatBRL(finalTotal)}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={registerMutation.isPending || liters <= 0}
              className="flex-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-float hover:opacity-90 disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              Confirmar Abastecimento
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
