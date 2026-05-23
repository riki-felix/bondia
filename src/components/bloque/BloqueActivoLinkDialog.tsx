import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, Search } from "lucide-react";
import type { BloqueActivoOption } from "@/lib/bloqueTypes";
import { cn } from "@/lib/utils";

interface BloqueActivoLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bloqueLabel: string;
  itemKind: "gasto" | "ingreso";
  itemLabel: string;
  activos: BloqueActivoOption[];
  currentActivoId: string | null;
  currentActivoNombre?: string;
  onSelect: (activoId: string | null) => void;
}

export function BloqueActivoLinkDialog({
  open,
  onOpenChange,
  bloqueLabel,
  itemKind,
  itemLabel,
  activos,
  currentActivoId,
  currentActivoNombre,
  onSelect,
}: BloqueActivoLinkDialogProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activos;
    return activos.filter((a) => a.nombre.toLowerCase().includes(q));
  }, [activos, search]);

  const handlePick = (activoId: string | null) => {
    onSelect(activoId);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSearch("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Relacionar con activo
          </DialogTitle>
          <DialogDescription>
            {bloqueLabel} · {itemKind === "gasto" ? "Gasto" : "Ingreso"}:{" "}
            <span className="font-medium text-foreground">
              {itemLabel || "Sin concepto"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar activo…"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-[min(50vh,320px)] overflow-y-auto rounded-md border divide-y">
          <button
            type="button"
            className={cn(
              "w-full px-3 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors",
              currentActivoId === null && "bg-muted/40"
            )}
            onClick={() => handlePick(null)}
          >
            <span className="text-muted-foreground">Sin activo</span>
            {currentActivoId === null && (
              <span className="ml-2 text-xs text-primary">(actual)</span>
            )}
          </button>

          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {activos.length === 0
                ? "No hay activos en este apartado. Créalos en Activos."
                : "Ningún activo coincide con la búsqueda."}
            </p>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                className={cn(
                  "w-full px-3 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors",
                  currentActivoId === a.id && "bg-muted/40"
                )}
                onClick={() => handlePick(a.id)}
              >
                {a.nombre}
                {currentActivoId === a.id && (
                  <span className="ml-2 text-xs text-primary">(actual)</span>
                )}
              </button>
            ))
          )}
        </div>

        {currentActivoId && currentActivoNombre && (
          <p className="text-xs text-muted-foreground">
            Vinculado ahora: <span className="font-medium">{currentActivoNombre}</span>
          </p>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
