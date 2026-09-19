import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Flame,
  Fuel,
  Sparkles,
  Calendar,
  ArrowRight,
  Check,
  Zap,
  Tag,
  ShieldCheck,
  Percent,
  Clock,
  ChevronRight,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { getActiveCustomerCampaigns, createFuelToken } from "@/lib/loyalty.functions";
import { formatBRL, type Campaign } from "@/lib/loyalty";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/app/ofertas")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ofertas e Promoções — FuelRewards" },
      {
        name: "description",
        content: "Aproveite descontos especiais sazonais, abasteça os valores promocionais e economize na bomba.",
      },
    ],
  }),
  component: CustomerOffersScreen,
});

const DAYS_OF_WEEK = [
  { id: 0, label: "Dom" },
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
];

const FUEL_PRICES: Record<string, { name: string; price: number }> = {
  gasolina_comum: { name: "Gasolina Comum", price: 5.89 },
  gasolina_aditivada: { name: "Gasolina Aditivada", price: 6.09 },
  etanol: { name: "Etanol Hidratado", price: 3.89 },
  diesel_s10: { name: "Diesel S10", price: 6.19 },
};

export default function CustomerOffersScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const campaignsFn = useServerFn(getActiveCustomerCampaigns);
  const createTokenFn = useServerFn(createFuelToken);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["customer-campaigns"],
    queryFn: () => campaignsFn({}),
  });

  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [fuelType, setFuelType] = useState("gasolina_comum");
  const [amountInput, setAmountInput] = useState(120);

  const tokenMutation = useMutation({
    mutationFn: () => createTokenFn({}),
    onSuccess: (data) => {
      queryClient.setQueryData(["active-token"], data);
      toast.success(
        `🎉 Oferta "${selectedCampaign?.title}" ativada! Apresente seu código na pista para abastecer ${formatBRL(amountInput)}.`,
      );
      setSelectedCampaign(null);
      navigate({ to: "/app/token" });
    },
    onError: () => toast.error("Não foi possível gerar o token. Tente novamente."),
  });

  const openFuelModal = (camp: any) => {
    setSelectedCampaign(camp);
    setAmountInput(camp.minFuelAmount > 0 ? camp.minFuelAmount : 100);
    if (camp.fuelTypes && camp.fuelTypes.length > 0) {
      setFuelType(camp.fuelTypes[0]);
    }
  };

  // Cálculos de simulação
  const currentFuel = FUEL_PRICES[fuelType] || FUEL_PRICES.gasolina_comum;
  const estimatedLiters = amountInput > 0 ? amountInput / currentFuel.price : 0;
  let estimatedSavings = 0;

  if (selectedCampaign) {
    if (selectedCampaign.discountType === "per_liter") {
      estimatedSavings = estimatedLiters * (selectedCampaign.discountValue || 0);
    } else {
      estimatedSavings = amountInput * ((selectedCampaign.discountValue || 0) / 100);
    }
  }

  const todayDay = new Date().getDay();

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-card">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Ofertas & Campanhas</h1>
            <p className="text-xs text-muted-foreground">Descontos especiais para você abastecer hoje</p>
          </div>
        </div>
      </div>

      {/* Banner Informativo */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent p-4 border border-amber-500/30">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-foreground">Como participar?</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Escolha uma campanha abaixo, clique para abastecer o valor indicado e gere seu token de desconto para apresentar ao frentista!
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Campanhas */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Carregando promoções vigentes...</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold">Nenhuma campanha no momento</p>
          <p className="text-xs text-muted-foreground mt-1">Fique de olho nas notificações para novas ofertas!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp: any) => {
            const isToday = camp.isTodayActive;
            const discountBadge =
              camp.discountType === "per_liter"
                ? `+${formatBRL(camp.discountValue)}/L`
                : `${camp.discountValue}% OFF`;

            return (
              <div
                key={camp.id}
                className={`relative overflow-hidden rounded-3xl border bg-card p-5 shadow-card transition ${
                  isToday
                    ? "border-amber-500/40 ring-1 ring-amber-500/20"
                    : "border-border opacity-95"
                }`}
              >
                {/* Badge de Hoje */}
                <div className="flex items-center justify-between gap-2">
                  {isToday ? (
                    <Badge className="bg-emerald-500 text-white font-bold text-[11px] gap-1 px-2.5 py-0.5 shadow-xs animate-pulse">
                      ● Válido Hoje!
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[11px] gap-1">
                      <Clock className="h-3 w-3" />
                      Em breve na semana
                    </Badge>
                  )}

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary border border-primary/20">
                    {discountBadge}
                  </span>
                </div>

                {/* Título & Descrição */}
                <div className="mt-3">
                  <h3 className="text-base font-bold text-foreground leading-snug">{camp.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {camp.description}
                  </p>
                </div>

                {/* Dias da semana */}
                <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                  <span className="text-[11px] text-muted-foreground">Dias com super desconto:</span>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((d) => {
                      const active = camp.daysOfWeek?.includes(d.id);
                      const isCurrentDay = d.id === todayDay;
                      return (
                        <span
                          key={d.id}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                            active
                              ? isCurrentDay
                                ? "bg-amber-500 text-white ring-2 ring-amber-400/50"
                                : "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground/40"
                          }`}
                        >
                          {d.label[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Condição de valor mínimo */}
                <div className="mt-2.5 flex items-center justify-between text-xs bg-muted/40 rounded-xl p-2.5">
                  <span className="text-muted-foreground">Abastecimento mínimo:</span>
                  <strong className="text-foreground font-bold">
                    {camp.minFuelAmount > 0 ? formatBRL(camp.minFuelAmount) : "Qualquer valor"}
                  </strong>
                </div>

                {/* Botão de Ação Direta */}
                <Button
                  onClick={() => openFuelModal(camp)}
                  className={`mt-4 w-full gap-2 rounded-2xl py-5 text-sm font-bold shadow-sm transition ${
                    isToday
                      ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:opacity-95"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  {camp.minFuelAmount > 0
                    ? `Abastecer ${formatBRL(camp.minFuelAmount)} com Desconto`
                    : "Abastecer e Ativar Desconto"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE PARTICIPAÇÃO E SIMULAÇÃO DE ABASTECIMENTO */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              Ativar Desconto da Campanha
            </DialogTitle>
            <DialogDescription>
              Confirme o valor pretendido para calcularmos sua economia e gerarmos seu token de abastecimento.
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Campanha Selecionada
                </span>
                <p className="text-sm font-bold text-foreground">{selectedCampaign.title}</p>
                <p className="text-xs text-muted-foreground">{selectedCampaign.description}</p>
              </div>

              {/* Escolha do Combustível */}
              <div>
                <label className="text-xs font-bold text-foreground">Escolha o Combustível:</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {Object.entries(FUEL_PRICES).map(([key, item]) => {
                    const isSelected = fuelType === key;
                    const isEligible = !selectedCampaign.fuelTypes || selectedCampaign.fuelTypes.includes(key);

                    return (
                      <button
                        type="button"
                        key={key}
                        disabled={!isEligible}
                        onClick={() => setFuelType(key)}
                        className={`rounded-xl border p-2.5 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                            : isEligible
                            ? "border-border text-foreground hover:bg-muted/40"
                            : "border-border/50 text-muted-foreground/40 bg-muted/20 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs">{item.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {formatBRL(item.price)}/L
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valor do Abastecimento */}
              <div>
                <label className="text-xs font-bold text-foreground">Quanto deseja abastecer?</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="10"
                      min={selectedCampaign.minFuelAmount || 20}
                      value={amountInput}
                      onChange={(e) => setAmountInput(Number(e.target.value))}
                      className="pl-9 text-base font-extrabold"
                    />
                  </div>
                </div>

                {/* Atalhos de valor */}
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {[50, 80, 100, 120, 150, 200].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmountInput(val)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                        amountInput === val
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      R$ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caixa de Economia Estimada */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Litragem Estimada:</span>
                  <strong className="text-foreground">{estimatedLiters.toFixed(2)} Litros</strong>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-500/20 pt-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Sua Economia Direto na Bomba:
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatBRL(estimatedSavings)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
              Voltar
            </Button>
            <Button
              onClick={() => tokenMutation.mutate()}
              disabled={tokenMutation.isPending}
              className="gap-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold shadow-md"
            >
              <Zap className="h-4 w-4" />
              {tokenMutation.isPending ? "Gerando Token..." : "Gerar Token de Abastecimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
