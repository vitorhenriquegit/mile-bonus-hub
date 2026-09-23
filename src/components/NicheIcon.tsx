import React from "react";
import {
  Wrench,
  Sparkles,
  Utensils,
  ShoppingBag,
  Fuel,
  Store,
  type LucideIcon,
} from "lucide-react";
import { type NicheId, NICHES } from "@/lib/niche";

export const NICHE_ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Sparkles,
  Utensils,
  ShoppingBag,
  Fuel,
  Store,
};

export function NicheIcon({
  name,
  nicheId,
  className = "h-4 w-4",
}: {
  name?: string;
  nicheId?: NicheId;
  className?: string;
}) {
  const iconKey = name || (nicheId ? NICHES[nicheId]?.iconName : undefined) || "Store";
  const IconComponent = NICHE_ICON_MAP[iconKey] || Store;
  return <IconComponent className={className} />;
}
