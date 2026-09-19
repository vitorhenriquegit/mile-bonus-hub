import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, SlidersHorizontal, Brain, Fuel, Radio, LogOut, MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStations } from "@/lib/loyalty.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardShell,
});

function DashboardShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stationsFn = useServerFn(getStations);

  const stationsQuery = useQuery({ queryKey: ["stations"], queryFn: () => stationsFn({}) });
  const [selectedStationId, setSelectedStationId] = useState<string>("");

  const activeStation = stationsQuery.data?.find((s) => s.id === selectedStationId) || stationsQuery.data?.[0];

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = [
    { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { to: "/dashboard/monitor", label: "Monitor de Pista", icon: Radio },
    { to: "/dashboard/roleta", label: "Roleta da Sorte", icon: Sparkles },
    { to: "/dashboard/regras", label: "Tiers e Regras", icon: SlidersHorizontal },
    { to: "/dashboard/clientes", label: "Inteligência de Clientes", icon: Brain },
  ] as const;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border/40">
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

        <nav className="mt-4 px-3">
          <ul className="space-y-1">
            {items.map((it) => {
              const active = pathname === it.to;
              const Icon = it.icon;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-semibold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto p-4 border-t border-sidebar-border/40">
          <div className="rounded-xl bg-sidebar-accent p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Posto Ativo</p>
            <p className="text-xs font-semibold truncate mt-0.5">{activeStation?.name || "Posto Matriz"}</p>
            <p className="text-[11px] opacity-75">{activeStation?.city ? `${activeStation.city}/${activeStation.state}` : "Rede Principal"}</p>
          </div>
          <button
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-2 px-1 py-1 text-xs opacity-70 hover:opacity-100"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Fuel className="h-4 w-4" />
            </div>
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

