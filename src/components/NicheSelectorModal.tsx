import { useState } from "react";
import { Check, Store, ArrowRight } from "lucide-react";
import { useNiche } from "@/lib/niche-context";
import { type NicheId, type NicheConfig } from "@/lib/niche";
import { NicheIcon } from "@/components/NicheIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NicheSelectorModal() {
  const { currentNiche, setNicheId, allNiches } = useNiche();
  const [open, setOpen] = useState(false);

  const handleSelect = (id: NicheId) => {
    setNicheId(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition hover:border-primary/50 hover:bg-accent"
        >
          <div className="grid h-5 w-5 place-items-center rounded-md bg-primary/10 text-primary">
            <NicheIcon name={currentNiche.iconName} className="h-3.5 w-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
              Segmento Ativo
            </span>
            <span className="font-bold text-foreground text-xs leading-tight truncate max-w-[140px] block">
              {currentNiche.badge}
            </span>
          </div>
          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary sm:hidden">
            {currentNiche.badge}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Configuração de Segmento & Nicho
              </DialogTitle>
              <DialogDescription className="text-xs">
                Selecione o nicho do seu estabelecimento. A plataforma adapta automaticamente vocabulário, regras, métricas e o terminal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {allNiches.map((n: NicheConfig) => {
            const isSelected = n.id === currentNiche.id;

            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleSelect(n.id)}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-xl ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <NicheIcon name={n.iconName} className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {n.badge}
                        </span>
                        <h3 className="text-sm font-bold text-foreground leading-tight">
                          {n.name}
                        </h3>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {n.subtitle}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    Métrica: <strong className="text-foreground">{n.terms.metricLabel}</strong>
                  </span>
                  <span className="text-primary font-semibold flex items-center gap-0.5">
                    {isSelected ? "Ativo" : "Selecionar"} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
