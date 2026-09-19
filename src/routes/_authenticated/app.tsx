import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Ticket, ReceiptText, Sparkles, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppShell,
});

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const tabs = [
    { to: "/app", label: "Início", icon: Home },
    { to: "/app/roleta", label: "Roleta", icon: Sparkles },
    { to: "/app/token", label: "Token", icon: Ticket },
    { to: "/app/historico", label: "Histórico", icon: ReceiptText },
  ] as const;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-card">
        <button
          onClick={signOut}
          className="absolute right-4 top-4 z-40 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
        <main className="flex-1 pb-24">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-card/95 backdrop-blur">
          <ul className="grid grid-cols-4">
            {tabs.map((t) => {
              const active = pathname === t.to;
              const Icon = t.icon;
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition ${
                      active ? "text-primary font-bold" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
