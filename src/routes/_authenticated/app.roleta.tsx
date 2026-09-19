import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Sparkles, Gift, Trophy, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { getWheelPrizes, spinWheelServer } from "@/lib/loyalty.functions";
import { SpinWheel } from "@/components/SpinWheel";
import { DEFAULT_WHEEL_PRIZES, type WheelPrize } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/app/roleta")({
  ssr: false,
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
    <div className="relative flex min-h-screen flex-col px-5 pt-6 pb-24 bg-gradient-to-b from-background via-card/50 to-background overflow-hidden">
      {/* Background Decorative Glow que cresce ao girar */}
      <div
        className={`absolute top-20 left-1/2 -translate-x-1/2 rounded-full blur-3xl pointer-events-none -z-10 transition-all duration-700 ${
          mustSpin ? "w-96 h-96 bg-amber-500/35" : "w-72 h-72 bg-amber-500/15"
        }`}
      />

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card/80 backdrop-blur shadow-xs transition hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-extrabold flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
          <Sparkles className="h-4 w-4 text-amber-500" /> Roleta da Sorte
        </span>
        <div className="w-10" />
      </div>

      {/* Hero Header */}
      <div className={`mt-4 text-center space-y-1.5 transition-all duration-500 ${mustSpin ? "opacity-25 scale-95" : "opacity-100 scale-100"}`}>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/30 px-3.5 py-1 text-xs font-black text-amber-600 dark:text-amber-400 shadow-xs">
          <Gift className="h-3.5 w-3.5 animate-bounce" /> Giro Diário Disponível!
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Gire e Ganhe Prêmios
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Prêmios imediatos de desconto por litro e brindes direto no seu abastecimento!
        </p>
      </div>

      {/* Center Canvas Spin Wheel com Zoom Dinâmico ao Girar */}
      <div
        className={`my-6 flex flex-col items-center justify-center relative transition-all duration-700 ease-out origin-center ${
          mustSpin
            ? "scale-[1.18] sm:scale-125 z-40 my-9 drop-shadow-2xl"
            : "scale-100 z-10"
        }`}
      >
        <SpinWheel
          prizes={prizes}
          mustSpin={mustSpin}
          targetIndex={targetIndex}
          onStopSpinning={handleStopSpinning}
          size={315}
        />
      </div>

      {/* Bottom Controls */}
      <div className={`mt-auto space-y-3 transition-all duration-500 ${mustSpin ? "opacity-80" : "opacity-100"}`}>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card p-3 text-center text-xs">
          <p className="text-muted-foreground">
            🎯 Todos os giros têm prêmio garantido para o seu próximo abastecimento.
          </p>
        </div>

        <button
          onClick={() => spinMutation.mutate()}
          disabled={mustSpin || spinMutation.isPending}
          className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-6 py-4 text-base font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:opacity-95 disabled:opacity-50 transition active:scale-[0.98] cursor-pointer"
        >
          {spinMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : mustSpin ? (
            <RefreshCw className="h-5 w-5 animate-spin text-slate-950" />
          ) : (
            <Sparkles className="h-5 w-5 text-slate-950 animate-spin" style={{ animationDuration: "3s" }} />
          )}
          <span className="tracking-wide uppercase text-sm font-black">
            {mustSpin ? "Girando a Roleta..." : "Girar Roleta Grátis"}
          </span>
        </button>
      </div>

      {/* Winner Celebration Modal */}
      {showWinnerModal && wonPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-amber-500/40 bg-card p-6 text-center shadow-2xl space-y-4 overflow-hidden">
            {/* Modal Glow Header */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/25 rounded-full blur-2xl pointer-events-none" />

            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30">
              {wonPrize.isWin ? <Trophy className="h-10 w-10 animate-bounce" /> : <Gift className="h-10 w-10" />}
            </div>

            <div>
              <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {wonPrize.isWin ? "🎉 Parabéns! Você foi Premiado!" : "Resultado da Roleta"}
              </span>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">{wonPrize.label}</h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{wonPrize.sublabel}</p>
            </div>

            {wonPrize.isWin && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-muted-foreground flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  O benefício foi ativado! Gere seu token de abastecimento para utilizar.
                </span>
              </div>
            )}

            <button
              onClick={() => {
                setShowWinnerModal(false);
                navigate({ to: "/app/token" });
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-black text-slate-950 shadow-md hover:opacity-90 transition active:scale-95"
            >
              Resgatar na Bomba →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
