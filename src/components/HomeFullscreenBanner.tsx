import React, { useState, useEffect } from "react";
import { X, ArrowRight, Zap, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type EnhancedBanner } from "@/lib/home-layout";

export function HomeFullscreenBanner({
  banner,
  onClose,
}: {
  banner: EnhancedBanner;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [countdown, setCountdown] = useState<number>(banner.autoCloseSeconds || 8);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const handleAction = () => {
    handleClose();
    if (banner.actionType === "token") {
      navigate({ to: "/app/token" });
    } else if (banner.actionType === "roleta") {
      navigate({ to: "/app/roleta" });
    } else if (banner.actionType === "ofertas") {
      navigate({ to: "/app/ofertas" });
    } else if (banner.actionType === "external" && banner.actionUrl) {
      window.open(banner.actionUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-gradient-to-b from-primary via-background to-card p-6 text-white animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur">
          {banner.badge || "DESTAQUE ESPECIAL"}
        </span>

        <button
          onClick={handleClose}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30 backdrop-blur transition"
        >
          <span>Pular</span>
          {countdown > 0 && <span className="opacity-80">({countdown}s)</span>}
          <X className="h-3.5 w-3.5 ml-0.5" />
        </button>
      </div>

      {/* Center Hero */}
      <div className="my-auto max-w-sm mx-auto text-center space-y-4">
        {banner.imageUrl ? (
          <div className="mx-auto aspect-square w-64 max-w-full overflow-hidden rounded-3xl shadow-float border-2 border-white/20">
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-white/20 backdrop-blur shadow-float">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow">
            {banner.title}
          </h1>
          <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto drop-shadow">
            {banner.subtitle}
          </p>
        </div>

        {banner.modalDetails?.description && (
          <p className="rounded-2xl bg-black/25 p-3 text-xs text-white/90 backdrop-blur">
            {banner.modalDetails.description}
          </p>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-sm mx-auto w-full space-y-2 pt-4">
        <button
          type="button"
          onClick={handleAction}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white py-4 px-6 text-sm font-black text-primary shadow-float hover:bg-white/90 transition"
        >
          {banner.actionLabel || "Aproveitar Agora"} <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="w-full py-2 text-xs font-semibold text-white/70 hover:text-white transition"
        >
          Continuar para o aplicativo
        </button>
      </div>
    </div>
  );
}
