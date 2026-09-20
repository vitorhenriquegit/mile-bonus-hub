import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Coffee,
  Wrench,
  Droplets,
  Sparkles,
  Fuel,
  Gift,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Info,
  X,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import type { PromotionalBanner } from "@/lib/loyalty";

interface HomeBannerSliderProps {
  banners: PromotionalBanner[];
}

export function HomeBannerSlider({ banners }: HomeBannerSliderProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedModalBanner, setSelectedModalBanner] = useState<PromotionalBanner | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play interval
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex] || banners[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      // Swiped left -> next
      handleNext();
    } else if (diff < -50) {
      // Swiped right -> prev
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleAction = (banner: PromotionalBanner) => {
    switch (banner.actionType) {
      case "token":
        navigate({ to: "/app/token" });
        break;
      case "roleta":
        navigate({ to: "/app/roleta" });
        break;
      case "ofertas":
        navigate({ to: "/app/ofertas" });
        break;
      case "external":
        if (banner.actionUrl) {
          window.open(banner.actionUrl, "_blank", "noopener,noreferrer");
        }
        break;
      case "modal":
      default:
        setSelectedModalBanner(banner);
        break;
    }
  };

  const renderIcon = (iconName: PromotionalBanner["icon"], className = "h-6 w-6") => {
    switch (iconName) {
      case "coffee":
        return <Coffee className={className} />;
      case "wrench":
        return <Wrench className={className} />;
      case "droplets":
        return <Droplets className={className} />;
      case "sparkles":
        return <Sparkles className={className} />;
      case "fuel":
        return <Fuel className={className} />;
      case "gift":
        return <Gift className={className} />;
      case "tag":
      default:
        return <Tag className={className} />;
    }
  };

  const getGradientClass = (theme: PromotionalBanner["theme"]) => {
    switch (theme) {
      case "amber":
        return "from-amber-600 via-amber-700 to-amber-950";
      case "emerald":
        return "from-emerald-600 via-teal-700 to-emerald-950";
      case "blue":
        return "from-blue-600 via-indigo-700 to-slate-950";
      case "purple":
        return "from-purple-600 via-fuchsia-700 to-slate-950";
      case "rose":
        return "from-rose-600 via-pink-700 to-slate-950";
      case "dark":
      default:
        return "from-slate-800 via-zinc-900 to-black";
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl group select-none shadow-card"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Active Banner Slide */}
      <div
        className={`relative min-h-[160px] p-5 bg-gradient-to-br ${getGradientClass(
          currentBanner.theme
        )} text-white transition-all duration-500 ease-out flex flex-col justify-between overflow-hidden`}
      >
        {/* Decorative ambient background blur & pattern */}
        <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

        {/* Top bar: Badge & Counter */}
        <div className="flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-black tracking-wider uppercase border border-white/20 shadow-xs">
            {renderIcon(currentBanner.icon, "h-3.5 w-3.5")}
            {currentBanner.badge}
          </span>

          {banners.length > 1 && (
            <span className="text-[10px] font-bold text-white/80 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {currentIndex + 1} / {banners.length}
            </span>
          )}
        </div>

        {/* Center Content */}
        <div className="my-2.5 z-10 pr-12">
          <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug drop-shadow-xs">
            {currentBanner.title}
          </h3>
          <p className="mt-1 text-xs text-white/85 line-clamp-2 leading-relaxed">
            {currentBanner.subtitle}
          </p>
        </div>

        {/* Bottom Bar: Action Button */}
        <div className="flex items-center justify-between pt-1 z-10">
          <button
            onClick={() => handleAction(currentBanner)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white text-slate-900 px-3.5 py-1.5 text-xs font-black shadow-float transition-transform active:scale-95 hover:bg-white/90"
          >
            {currentBanner.actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* Dots Pagination */}
          {banners.length > 1 && (
            <div className="flex items-center gap-1.5">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-5 bg-white shadow-xs"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Large Faded Watermark Icon on the Right */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none scale-150 text-white">
          {renderIcon(currentBanner.icon, "h-28 w-28")}
        </div>

        {/* Navigation Arrows (Visíveis no hover ou telas maiores) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/30 backdrop-blur-md text-white/80 opacity-0 group-hover:opacity-100 transition hover:bg-black/50 hover:text-white"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/30 backdrop-blur-md text-white/80 opacity-0 group-hover:opacity-100 transition hover:bg-black/50 hover:text-white"
              aria-label="Próximo banner"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Modal de Detalhes da Promoção */}
      {selectedModalBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-200">
            {/* Header com Tema */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${getGradientClass(
                    selectedModalBanner.theme
                  )} text-white shadow-card`}
                >
                  {renderIcon(selectedModalBanner.icon, "h-5 w-5")}
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                    {selectedModalBanner.badge}
                  </span>
                  <h4 className="text-base font-black leading-tight">
                    {selectedModalBanner.title}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setSelectedModalBanner(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Descrição & Regras */}
            <div className="mt-4 space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed text-sm">
                {selectedModalBanner.modalDetails?.description || selectedModalBanner.subtitle}
              </p>

              {selectedModalBanner.modalDetails?.rules && (
                <div className="rounded-2xl border border-border bg-muted/40 p-3.5 space-y-2">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-primary" /> Condições da Oferta:
                  </p>
                  <ul className="space-y-1.5 text-muted-foreground">
                    {selectedModalBanner.modalDetails.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedModalBanner.modalDetails?.validUntil && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {selectedModalBanner.modalDetails.validUntil}
                </p>
              )}
            </div>

            {/* Footer Action */}
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setSelectedModalBanner(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold hover:bg-muted"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setSelectedModalBanner(null);
                  navigate({ to: "/app/token" });
                }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                Gerar Token no Posto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
