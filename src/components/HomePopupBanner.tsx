import React, { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight, Zap, Gift, Tag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type EnhancedBanner } from "@/lib/home-layout";

export function HomePopupBanner({
  banner,
  onClose,
}: {
  banner: EnhancedBanner;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [countdown, setCountdown] = useState<number>(banner.autoCloseSeconds || 0);

  useEffect(() => {
    if (!banner.autoCloseSeconds || banner.autoCloseSeconds <= 0) return;
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
  }, [banner.autoCloseSeconds]);

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-float text-foreground animate-in slide-in-from-bottom duration-300">
        <button
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition"
          aria-label="Fechar pop-up"
        >
          <X className="h-4 w-4" />
        </button>

        {banner.imageUrl ? (
          <div className="relative -mx-5 -mt-5 mb-4 aspect-video overflow-hidden bg-muted">
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="h-full w-full object-cover"
            />
            {countdown > 0 && (
              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                Fecha em {countdown}s
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
              {banner.badge || "PROMOÇÃO"}
            </span>
            {countdown > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground">
                ({countdown}s)
              </span>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-foreground leading-snug">
            {banner.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {banner.subtitle}
          </p>
        </div>

        {banner.modalDetails?.rules && (
          <div className="mt-3.5 rounded-xl bg-accent/60 p-2.5 text-[11px] text-muted-foreground space-y-1">
            {banner.modalDetails.rules.slice(0, 2).map((rule, idx) => (
              <p key={idx} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary" /> {rule}
              </p>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold hover:bg-muted transition"
          >
            Depois
          </button>
          <button
            type="button"
            onClick={handleAction}
            className="flex-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 px-4 text-xs font-bold text-primary-foreground shadow-card hover:bg-primary/90 transition"
          >
            {banner.actionLabel || "Aproveitar"} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
