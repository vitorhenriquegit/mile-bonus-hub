import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Sparkles, Gift, Trophy, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { getWheelPrizes, spinWheelServer } from "@/lib/loyalty.functions";
import { SpinWheel } from "@/components/SpinWheel";
import { DEFAULT_WHEEL_PRIZES, type WheelPrize } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/app/roleta")({
  head: () => ({
    meta: [
      { title: "Roleta da Sorte — FuelRewards" },
      { name: "description", content: "Gire a Roleta da Sorte e ganhe descontos e bônus exclusivos no posto." },
      { property: "og:title", content: "Roleta da Sorte — FuelRewards" },
      { property: "og:description", content: "Gire a Roleta da Sorte e ganhe descontos e bônus exclusivos no posto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MobileRoletaScreen,
});

function MobileRoletaScreen() {
  const navigate = useNavigate();
  const getPrizesFn = useServerFn(getWheelPrizes);
  const spinFn = useServerFn(spinWheelServer);

  const prizesQuery = useQuery({
    queryKey: ["wheel-prizes"],
    queryFn: () => getPrizesFn({}),
  });

  const [mustSpin, setMustSpin] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const prizes: WheelPrize[] =
    prizesQuery.data && prizesQuery.data.length > 0 ? prizesQuery.data : DEFAULT_WHEEL_PRIZES;

  const spinMutation = useMutation({
    mutationFn: () => spinFn({}),
    onSuccess: (data) => {
      setTargetIndex(data.prizeIndex);
      setWonPrize(data.prize);
      setMustSpin(true);
    },
  });

  const handleStopSpinning = () => {
    setMustSpin(false);
    setShowWinnerModal(true);
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6 pb-24 bg-background">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold flex items-center gap-1.5 text-amber-500">
          <Sparkles className="h-4 w-4" /> Roleta da Sorte
        </span>
        <div className="w-10" />
      </div>

      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Gift className="h-3.5 w-3.5" /> Prêmios Diários na Bomba
        </span>
        <h1 className="mt-3 text-2xl font-black tracking-tight">Gire e Ganhe!</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Sorteie bônus de desconto por litro ou brindes exclusivos da conveniência.
        </p>
      </div>

      {/* Center Canvas Spin Wheel */}
      <div className="my-8 flex flex-col items-center justify-center">
        <SpinWheel
          prizes={prizes}
          mustSpin={mustSpin}
          targetIndex={targetIndex}
          onStopSpinning={handleStopSpinning}
          size={300}
        />
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={() => spinMutation.mutate()}
          disabled={mustSpin || spinMutation.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-base font-bold text-white shadow-float hover:opacity-95 disabled:opacity-50 transition active:scale-[0.99]"
        >
          {spinMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : mustSpin ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {mustSpin ? "Girando..." : "Girar Roleta Grátis"}
        </button>
      </div>

      {/* Winner Celebration Modal */}
      {showWinnerModal && wonPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-float space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg">
              {wonPrize.isWin ? <Trophy className="h-8 w-8" /> : <Gift className="h-8 w-8" />}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                {wonPrize.isWin ? "🎉 Parabéns! Você ganhou!" : "Resultado do Sorteio"}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{wonPrize.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{wonPrize.sublabel}</p>
            </div>

            {wonPrize.isWin && (
              <div className="rounded-2xl bg-accent p-3 text-xs text-muted-foreground flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>O bônus foi adicionado à sua conta para o próximo abastecimento!</span>
              </div>
            )}

            <button
              onClick={() => setShowWinnerModal(false)}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-card hover:opacity-90"
            >
              Resgatar e Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
