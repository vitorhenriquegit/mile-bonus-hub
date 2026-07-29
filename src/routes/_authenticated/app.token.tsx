import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck, Copy } from "lucide-react";
import { CURRENT_USER, formatBRL, tierFor } from "@/lib/mock";

export const Route = createFileRoute("/_authenticated/app/token")({
  component: TokenScreen,
});

const TOKEN_TTL = 120; // seconds

function genToken() {
  const n = Math.floor(100_000 + Math.random() * 900_000).toString();
  return `${n.slice(0, 3)} ${n.slice(3)}`;
}

function TokenScreen() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => genToken());
  const [remaining, setRemaining] = useState(TOKEN_TTL);
  const { current } = tierFor(CURRENT_USER.volumeMonth);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = useMemo(() => (remaining / TOKEN_TTL) * 100, [remaining]);
  const expired = remaining <= 0;

  function regen() {
    setToken(genToken());
    setRemaining(TOKEN_TTL);
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">Token de Abastecimento</span>
        <div className="w-10" />
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <ShieldCheck className="h-3.5 w-3.5" />
          Código seguro e único
        </div>

        <p className="mt-6 text-sm text-muted-foreground">Seu código dinâmico</p>
        <div
          className={`mt-3 select-all font-mono text-6xl font-black tracking-[0.1em] tabular-nums ${
            expired ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {token}
        </div>

        <button
          onClick={() => navigator.clipboard?.writeText(token.replace(" ", ""))}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Copy className="h-3.5 w-3.5" /> Copiar código
        </button>

        {/* Timer ring */}
        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                expired ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p
            className={`font-mono text-sm font-semibold tabular-nums ${
              expired ? "text-destructive" : "text-foreground"
            }`}
          >
            {expired ? "Código expirado" : `Expira em ${mm}:${ss}`}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Instruções</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe ao frentista o seu <b className="text-foreground">CPF</b> e este{" "}
          <b className="text-foreground">código de 6 dígitos</b> antes de iniciar o
          abastecimento. O desconto será aplicado direto na bomba.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3">
          <div>
            <p className="text-xs text-muted-foreground">CPF</p>
            <p className="font-mono text-sm font-semibold">{CURRENT_USER.cpf}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Desconto</p>
            <p className="text-sm font-semibold text-primary">
              {formatBRL(current.discount)}/L
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={regen}
        className="mt-auto mb-28 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold"
      >
        <RefreshCw className="h-4 w-4" />
        {expired ? "Gerar novo código" : "Renovar código"}
      </button>
    </div>
  );
}
