import React, { useState, useEffect, useRef } from "react";
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
  ExternalLink,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { type EnhancedBanner, type BannerFormat } from "@/lib/home-layout";

const BANNER_ICON_MAP: Record<string, LucideIcon> = {
  coffee: Coffee,
  wrench: Wrench,
  droplets: Droplets,
  sparkles: Sparkles,
  fuel: Fuel,
  gift: Gift,
  tag: Tag,
};

const THEME_GRADIENT_MAP: Record<string, string> = {
  amber: "from-amber-600/90 via-amber-700/80 to-stone-900",
  emerald: "from-emerald-600/90 via-emerald-700/80 to-stone-900",
  blue: "from-blue-600/90 via-blue-700/80 to-stone-900",
  purple: "from-purple-600/90 via-purple-700/80 to-stone-900",
  rose: "from-rose-600/90 via-rose-700/80 to-stone-900",
  dark: "from-stone-800 via-stone-900 to-black",
};

export function EnhancedBannerRenderer({
  banners,
  onBannerAction,
}: {
  banners: EnhancedBanner[];
  onBannerAction?: (banner: EnhancedBanner) => void;
}) {
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedModalBanner, setSelectedModalBanner] = useState<EnhancedBanner | null>(null);

  const activeBanners = banners.filter((b) => b.active);

  const horizontalBanners = activeBanners.filter((b) => b.format === "horizontal");
  const verticalBanners = activeBanners.filter((b) => b.format === "vertical");
  const carouselBanners = activeBanners.filter((b) => b.format === "carousel");

  // Autoplay for carousel
  useEffect(() => {
    if (carouselBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [carouselBanners.length]);

  const handleAction = (banner: EnhancedBanner) => {
    if (onBannerAction) {
      onBannerAction(banner);
      return;
    }

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

  if (activeBanners.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 1. CARROSSEL DE BANNERS */}
      {carouselBanners.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl shadow-card">
          <div
            className={`relative min-h-[170px] p-5 text-white bg-gradient-to-r ${
              THEME_GRADIENT_MAP[carouselBanners[carouselIndex]?.theme || "emerald"]
            }`}
          >
            {carouselBanners[carouselIndex]?.imageUrl && (
              <img
                src={carouselBanners[carouselIndex].imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-50"
              />
            )}

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur">
                    {carouselBanners[carouselIndex]?.badge}
                  </span>

                  <span className="text-[10px] font-bold text-white/70">
                    {carouselIndex + 1}/{carouselBanners.length}
                  </span>
                </div>

                <h3 className="mt-2.5 text-base font-extrabold text-white leading-tight line-clamp-2 drop-shadow">
                  {carouselBanners[carouselIndex]?.title}
                </h3>
                <p className="mt-1 text-xs text-white/85 line-clamp-2 drop-shadow">
                  {carouselBanners[carouselIndex]?.subtitle}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/20">
                <div className="flex gap-1.5">
                  {carouselBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === carouselIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAction(carouselBanners[carouselIndex])}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-stone-900 shadow-sm hover:bg-white/90 transition"
                >
                  {carouselBanners[carouselIndex]?.actionLabel || "Acessar"} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BANNERS HORIZONTAIS */}
      {horizontalBanners.map((banner) => {
        const IconComp = BANNER_ICON_MAP[banner.icon] || Tag;
        const gradient = THEME_GRADIENT_MAP[banner.theme] || THEME_GRADIENT_MAP.emerald;

        return (
          <div
            key={banner.id}
            className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-card bg-gradient-to-r ${gradient}`}
          >
            {banner.imageUrl && (
              <img
                src={banner.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-40"
              />
            )}

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur inline-block">
                  {banner.badge}
                </span>

                <h3 className="mt-2 text-base font-extrabold leading-snug drop-shadow line-clamp-1">
                  {banner.title}
                </h3>
                <p className="mt-1 text-xs text-white/85 line-clamp-2 drop-shadow">
                  {banner.subtitle}
                </p>
              </div>

              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
                <IconComp className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between pt-3 border-t border-white/20">
              <span className="text-[11px] text-white/70">Oferta válida pelo app</span>

              <button
                type="button"
                onClick={() => handleAction(banner)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-stone-900 shadow-sm hover:bg-white/90 transition"
              >
                {banner.actionLabel} <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}

      {/* 3. BANNERS VERTICAIS (Formato Card / Stories) */}
      {verticalBanners.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Destaques Especiais
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {verticalBanners.map((banner) => {
              const gradient = THEME_GRADIENT_MAP[banner.theme] || THEME_GRADIENT_MAP.purple;
              return (
                <div
                  key={banner.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-4 text-white shadow-card min-h-[200px] bg-gradient-to-b ${gradient}`}
                >
                  {banner.imageUrl && (
                    <img
                      src={banner.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-40 transition group-hover:scale-105"
                    />
                  )}

                  <div className="relative z-10">
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur inline-block">
                      {banner.badge}
                    </span>

                    <h4 className="mt-2 text-sm font-black leading-tight line-clamp-2 drop-shadow">
                      {banner.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-white/80 line-clamp-2 drop-shadow">
                      {banner.subtitle}
                    </p>
                  </div>

                  <div className="relative z-10 mt-3 pt-2 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => handleAction(banner)}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-white/90 py-1.5 px-2 text-xs font-bold text-stone-900 shadow-xs hover:bg-white transition"
                    >
                      {banner.actionLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Banner */}
      {selectedModalBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-float text-foreground">
            <button
              onClick={() => setSelectedModalBanner(null)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-primary">
              {selectedModalBanner.badge}
            </span>

            <h3 className="mt-2 text-lg font-bold leading-tight">
              {selectedModalBanner.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedModalBanner.subtitle}
            </p>

            {selectedModalBanner.modalDetails?.description && (
              <p className="mt-3 rounded-xl bg-accent/50 p-3 text-xs leading-relaxed text-foreground">
                {selectedModalBanner.modalDetails.description}
              </p>
            )}

            {selectedModalBanner.modalDetails?.rules && (
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Regras da promoção:</p>
                {selectedModalBanner.modalDetails.rules.map((rule, idx) => (
                  <p key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span className="h-1 w-1 rounded-full bg-primary" /> {rule}
                  </p>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedModalBanner(null)}
              className="mt-5 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
