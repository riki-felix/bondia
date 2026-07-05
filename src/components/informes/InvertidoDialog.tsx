import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import {
  type InvertidoByYear,
  invertidoBalanceAtYear,
} from "@/lib/invertidoStorage";
import {
  formatEuro,
  formatMoneyEdit,
  normalizeMoneyText,
  parseMoneyInput,
} from "@/lib/moneyCalc";

interface InvertidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  years: number[];
  byYear: InvertidoByYear;
  onSave: (byYear: InvertidoByYear) => void | Promise<void>;
}

export function InvertidoDialog({
  open,
  onOpenChange,
  years,
  byYear,
  onSave,
}: InvertidoDialogProps) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newYear, setNewYear] = useState("");
  const [saving, setSaving] = useState(false);

  const yearList = useMemo(() => {
    const set = new Set(years);
    for (const key of Object.keys(byYear)) {
      const y = Number(key);
      if (Number.isFinite(y)) set.add(y);
    }
    for (const key of Object.keys(draft)) {
      const y = Number(key);
      if (Number.isFinite(y)) set.add(y);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [years, byYear, draft]);

  useEffect(() => {
    if (!open) return;
    const set = new Set(years);
    for (const key of Object.keys(byYear)) {
      const y = Number(key);
      if (Number.isFinite(y)) set.add(y);
    }
    const list = Array.from(set).sort((a, b) => a - b);
    const next: Record<string, string> = {};
    for (const year of list) {
      const value = byYear[String(year)];
      next[String(year)] =
        value != null && value > 0 ? formatMoneyEdit(value) : "";
    }
    setDraft(next);
    setNewYear("");
  }, [open, byYear, years]);

  const draftByYear = useMemo((): InvertidoByYear => {
    const out: InvertidoByYear = {};
    for (const [year, text] of Object.entries(draft)) {
      const trimmed = text.trim();
      if (!trimmed) continue;
      const n = parseMoneyInput(normalizeMoneyText(trimmed));
      if (n != null && n > 0) out[year] = n;
    }
    return out;
  }, [draft]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draftByYear);
      onOpenChange(false);
    } catch {
      /* toast en el padre */
    } finally {
      setSaving(false);
    }
  };

  const addYear = () => {
    const y = Number(newYear.trim());
    if (!Number.isFinite(y) || y < 1000 || y > 2100) return;
    setDraft((prev) => ({
      ...prev,
      [String(y)]: prev[String(y)] ?? "",
    }));
    setNewYear("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capital invertido por ejercicio</DialogTitle>
          <DialogDescription>
            Indica cuánto capital nuevo aportaste cada año. El total mostrado en
            Informes es el balance acumulado hasta el ejercicio de la vista (no
            la suma de totales independientes).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {yearList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Añade un ejercicio para empezar.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[72px_1fr_1fr] gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>Año</span>
                <span>Nuevo en el año</span>
                <span className="text-right">Acumulado</span>
              </div>
              {yearList.map((year) => (
                <div
                  key={year}
                  className="grid grid-cols-[72px_1fr_1fr] items-center gap-2"
                >
                  <Label className="text-sm font-medium tabular-nums">
                    {year}
                  </Label>
                  <MoneyInput
                    className="h-9"
                    value={draft[String(year)] ?? ""}
                    onValueChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        [String(year)]: v,
                      }))
                    }
                  />
                  <span
                    data-money
                    className="text-right text-sm tabular-nums text-muted-foreground"
                  >
                    {formatEuro(invertidoBalanceAtYear(draftByYear, year))}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 border-t pt-3">
            <div className="flex-1">
              <Label htmlFor="invertido-new-year" className="text-xs">
                Añadir ejercicio
              </Label>
              <Input
                id="invertido-new-year"
                type="number"
                min={1000}
                max={2100}
                placeholder="2024"
                className="mt-1 h-9"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addYear();
                }}
              />
            </div>
            <Button type="button" variant="outline" onClick={addYear}>
              Añadir
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
