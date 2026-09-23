import React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Key,
  Flame,
  Sparkles,
  Receipt,
  MessageCircle,
  Share2,
  ShoppingBag,
  Wrench,
  MapPin,
  Gift,
  Tag,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { type QuickActionItem } from "@/lib/home-layout";

const QUICK_ICON_MAP: Record<string, LucideIcon> = {
  Key,
  Flame,
  Sparkles,
  Receipt,
  MessageCircle,
  Share2,
  ShoppingBag,
  Wrench,
  MapPin,
  Gift,
  Tag,
};

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  primary: {
    bg: "bg-primary/10 text-primary",
    text: "text-foreground",
    ring: "hover:border-primary/40",
  },
  emerald: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    text: "text-foreground",
    ring: "hover:border-emerald-500/40",
  },
  amber: {
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    text: "text-foreground",
    ring: "hover:border-amber-500/40",
  },
  blue: {
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    text: "text-foreground",
    ring: "hover:border-blue-500/40",
  },
  purple: {
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    text: "text-foreground",
    ring: "hover:border-purple-500/40",
  },
  rose: {
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    text: "text-foreground",
    ring: "hover:border-rose-500/40",
  },
};

export function HomeQuickActions({
  items,
  onItemClick,
}: {
  items: QuickActionItem[];
  onItemClick?: (item: QuickActionItem) => void;
}) {
  const navigate = useNavigate();

  const enabledItems = items.filter((it) => it.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  if (enabledItems.length === 0) return null;

  const handleClick = (item: QuickActionItem) => {
    if (onItemClick) {
      onItemClick(item);
      return;
    }

    if (item.actionType === "external" && item.target) {
      window.open(item.target, "_blank", "noopener,noreferrer");
    } else if (item.target) {
      navigate({ to: item.target as any });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Acessos Rápidos
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {enabledItems.map((item) => {
          const IconComp = QUICK_ICON_MAP[item.icon] || HelpCircle;
          const colors = COLOR_MAP[item.color || "primary"] || COLOR_MAP.primary;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item)}
              className={`group relative flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-3 text-center transition hover:-translate-y-0.5 hover:shadow-card ${colors.ring}`}
            >
              {item.badge && (
                <span className="absolute -top-1.5 right-1 rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-primary-foreground shadow-xs">
                  {item.badge}
                </span>
              )}

              <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${colors.bg} transition group-hover:scale-105`}
              >
                <IconComp className="h-5 w-5" />
              </div>

              <span className="mt-2 text-xs font-semibold leading-tight text-foreground line-clamp-1">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
