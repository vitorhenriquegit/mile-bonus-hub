import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  SlidersHorizontal,
  Brain,
  Fuel,
  Radio,
  LogOut,
  MapPin,
  Sparkles,
  Megaphone,
  ShieldAlert,
  Layers,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStations } from "@/lib/loyalty.functions";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  component: DashboardShell,
});

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavModule = {
  title: string;
  items: NavItem[];
};

const navModules: NavModule[] = [
  {
    title: "Dashboards",
    items: [
      { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
      { to: "/dashboard/clientes", label: "Inteligência de Clientes", icon: Brain },
    ],
  },
  {
    title: "Operação",
    items: [
      { to: "/dashboard/monitor", label: "Monitor de Pista", icon: Radio, badge: "Ao vivo" },
      { to: "/dashboard/seguranca", label: "Segurança & Fraude", icon: ShieldAlert },
      { to: "/dashboard/regras", label: "Tiers e Regras", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Marketing",
    items: [
      { to: "/dashboard/campanhas", label: "Campanhas Promocionais", icon: Megaphone },
      { to: "/dashboard/banners", label: "Banners do App", icon: Layers },
      { to: "/dashboard/roleta", label: "Roleta da Sorte", icon: Sparkles },
    ],
  },
];

function NavigationContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6">
      {navModules.map((module) => (
        <div key={module.title} className="space-y-1.5">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
            {module.title}
          </div>
          <ul className="space-y-1">
            {module.items.map((it) => {
              const active = pathname === it.to;
              const Icon = it.icon;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    onClick={onNavigate}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-semibold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active
                            ? "text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
                        }`}
                      />
                      <span className="truncate">{it.label}</span>
                    </div>
                    {it.badge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {it.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function DashboardShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stationsFn = useServerFn(getStations);

  const stationsQuery = useQuery({ queryKey: ["stations"], queryFn: () => stationsFn({}) });
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeStation = stationsQuery.data?.find((s) => s.id === selectedStationId) || stationsQuery.data?.[0];

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border/40 bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border/40 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">FuelRewards</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider opacity-60">
              Painel do Gestor
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavigationContent pathname={pathname} />
        </div>

        <div className="mt-auto p-4 border-t border-sidebar-border/40 shrink-0">
          <div className="rounded-xl bg-sidebar-accent p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Posto Ativo</p>
            <p className="text-xs font-semibold truncate mt-0.5">{activeStation?.name || "Posto Matriz"}</p>
            <p className="text-[11px] opacity-75">
              {activeStation?.city ? `${activeStation.city}/${activeStation.state}` : "Rede Principal"}
            </p>
          </div>
          <button
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-2 px-1 py-1 text-xs opacity-70 hover:opacity-100 transition"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur">
          {/* Mobile Sheet Trigger & Brand */}
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir navegação por módulos"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-accent transition"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-0 bg-sidebar text-sidebar-foreground border-sidebar-border/40">
                <SheetHeader className="p-4 border-b border-sidebar-border/40 text-left">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
                      <Fuel className="h-4 w-4" />
                    </div>
                    <div>
                      <SheetTitle className="text-sm font-bold leading-none text-sidebar-foreground">FuelRewards</SheetTitle>
                      <SheetDescription className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 mt-1">
                        Painel do Gestor
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <NavigationContent pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
                </div>

                <div className="mt-auto p-4 border-t border-sidebar-border/40">
                  <div className="rounded-xl bg-sidebar-accent p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Posto Ativo</p>
                    <p className="text-xs font-semibold truncate mt-0.5">{activeStation?.name || "Posto Matriz"}</p>
                    <p className="text-[11px] opacity-75">
                      {activeStation?.city ? `${activeStation.city}/${activeStation.state}` : "Rede Principal"}
                    </p>
                  </div>
                  <button
                    onClick={signOut}
                    className="mt-3 flex w-full items-center gap-2 px-1 py-1 text-xs opacity-70 hover:opacity-100 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair da conta
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-sm font-bold">FuelRewards</span>
          </div>

          {stationsQuery.data && stationsQuery.data.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Posto:</span>
              <select
                value={selectedStationId || activeStation?.id || ""}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {stationsQuery.data.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} — {st.city}/{st.state}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent md:hidden"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

