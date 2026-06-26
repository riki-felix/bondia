import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Target } from "lucide-react";
import {
  formatEuro,
  formatMoneyEdit,
  normalizeMoneyText,
  parseMoneyInput,
} from "@/lib/moneyCalc";
import type { Objetivo } from "@/lib/objetivos";
import { OBJETIVO_BENEFICIO_MEDIO_OPERACION } from "@/lib/objetivos";

const FALLBACK_OBJETIVOS: Objetivo[] = [
  {
    id: OBJETIVO_BENEFICIO_MEDIO_OPERACION,
    etiqueta: "Beneficio medio por operación",
    valor: null,
  },
];

interface Props {
  initialData: Objetivo[];
}

export default function ObjetivosSection({ initialData }: Props) {
  const [rows, setRows] = useState<Objetivo[]>(
    initialData.length > 0 ? initialData : FALLBACK_OBJETIVOS
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = useCallback((row: Objetivo) => {
    setEditingId(row.id);
    setDraft(row.valor != null ? formatMoneyEdit(row.valor) : "");
  }, []);

  const saveValor = useCallback(
    async (id: string, raw: string) => {
      const trimmed = raw.trim();
      const parsed = trimmed === "" ? null : parseMoneyInput(normalizeMoneyText(trimmed));
      if (trimmed !== "" && parsed === null) {
        toast.error("Importe no válido");
        return;
      }

      const prev = rows.find((r) => r.id === id);
      setRows((current) =>
        current.map((r) => (r.id === id ? { ...r, valor: parsed } : r))
      );
      setEditingId(null);

      try {
        const res = await fetch("/.netlify/functions/updateObjetivo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, valor: parsed }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al guardar");
        setRows((current) =>
          current.map((r) =>
            r.id === id
              ? {
                  ...r,
                  valor:
                    data.valor != null && Number.isFinite(Number(data.valor))
                      ? Number(data.valor)
                      : null,
                }
              : r
          )
        );
        toast.success("Objetivo guardado");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Error al guardar";
        toast.error(message);
        if (prev) {
          setRows((current) =>
            current.map((r) => (r.id === id ? prev : r))
          );
        }
      }
    },
    [rows]
  );

  return (
    <Card>
      <CardHeader className="pb-2 space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Objetivos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay objetivos configurados.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-medium">{row.etiqueta}</p>
                  <p className="text-xs text-muted-foreground">
                    Valor económico (€)
                  </p>
                </div>
                {editingId === row.id ? (
                  <Input
                    autoFocus
                    className="h-9 w-40 text-right tabular-nums"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => saveValor(row.id, draft)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveValor(row.id, draft);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    data-money
                    className="h-9 min-w-[120px] rounded-md border bg-background px-3 text-right text-sm font-semibold tabular-nums hover:bg-muted/50 transition-colors"
                    onClick={() => startEdit(row)}
                  >
                    {row.valor != null ? formatEuro(row.valor) : "—"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
