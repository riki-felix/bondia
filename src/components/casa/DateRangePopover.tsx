// src/components/casa/DateRangePopover.tsx
// Calendar icon that opens a popover with two date inputs (inicio / fin)
import { useState } from "react";
import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface DateRangePopoverProps {
  fechaInicio: string | null;
  fechaFin: string | null;
  onSave: (inicio: string | null, fin: string | null) => void;
}

function fmtShort(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function DateRangePopover({
  fechaInicio,
  fechaFin,
  onSave,
}: DateRangePopoverProps) {
  const [open, setOpen] = useState(false);
  const [inicio, setInicio] = useState(fechaInicio ?? "");
  const [fin, setFin] = useState(fechaFin ?? "");

  const hasDates = !!fechaInicio || !!fechaFin;

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setInicio(fechaInicio ?? "");
      setFin(fechaFin ?? "");
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    onSave(inicio || null, fin || null);
    setOpen(false);
  };

  const handleClear = () => {
    onSave(null, null);
    setInicio("");
    setFin("");
    setOpen(false);
  };

  // Tooltip text
  const tooltip = hasDates
    ? `${fmtShort(fechaInicio) || "∞"} → ${fmtShort(fechaFin) || "∞"}`
    : "Sin duración";

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={tooltip}
          className={`inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted/60 transition-colors ${
            hasDates
              ? "text-primary"
              : "text-muted-foreground/40 hover:text-muted-foreground"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start" sideOffset={6}>
        <p className="text-xs font-medium text-muted-foreground">Duración</p>
        <div className="space-y-2">
          <div>
            <Label htmlFor="dr-inicio" className="text-xs">
              Inicio
            </Label>
            <Input
              id="dr-inicio"
              type="date"
              className="h-8 text-sm"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dr-fin" className="text-xs">
              Fin
            </Label>
            <Input
              id="dr-fin"
              type="date"
              className="h-8 text-sm"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={handleClear}
          >
            Limpiar
          </Button>
          <Button size="sm" className="text-xs h-7" onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
