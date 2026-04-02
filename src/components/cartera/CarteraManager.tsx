import { useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { Trash2, ArrowRight, Building2, Home, Briefcase, PiggyBank, Pencil } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { formatEuro } from "@/lib/money";
import type { MovimientoCartera, CarteraId } from "@/lib/bloqueTypes";
import { CARTERA_OPTIONS } from "@/lib/bloqueTypes";

interface Props {
  ejercicio: number;
  initialMovimientos: MovimientoCartera[];
  walletIngresos: Record<CarteraId, number>;
  walletMonthly: Record<CarteraId, number[]>;
  ahorroBase: number;
}

const CARTERA_ICONS: Record<CarteraId, typeof Building2> = {
  inversiones: Building2,
  familiar: Home,
  sanyus: Briefcase,
  ahorro: PiggyBank,
};

const CARTERA_LABELS: Record<CarteraId, string> = {
  inversiones: "Inversiones",
  familiar: "Familiar",
  sanyus: "Sanyus",
  ahorro: "Ahorro",
};

export default function CarteraManager({
  ejercicio,
  initialMovimientos,
  walletIngresos,
  walletMonthly,
  ahorroBase: initialAhorro,
}: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoCartera[]>(initialMovimientos);
  const [ahorroBase, setAhorroBase] = useState(initialAhorro);
  const [editingAhorro, setEditingAhorro] = useState(false);
  const [ahorroInput, setAhorroInput] = useState(String(initialAhorro));
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; concepto: string } | null>(null);

  // Form state
  const [origen, setOrigen] = useState<CarteraId | "">("");
  const [destino, setDestino] = useState<CarteraId | "">("");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  // Compute wallet balances
  const balances = useMemo(() => {
    const b: Record<CarteraId, number> = {
      inversiones: walletIngresos.inversiones,
      familiar: walletIngresos.familiar,
      sanyus: walletIngresos.sanyus,
      ahorro: ahorroBase,
    };
    for (const mov of movimientos) {
      b[mov.destino] += mov.importe;
      b[mov.origen] -= mov.importe;
    }
    return b;
  }, [movimientos, walletIngresos, ahorroBase]);

  const handleCreate = useCallback(async () => {
    if (!origen || !destino || !concepto.trim() || !importe) {
      toast.error("Completa todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/.netlify/functions/createMovimientoCartera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origen, destino, concepto: concepto.trim(), importe, fecha, ejercicio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear");
      setMovimientos((prev) => [data, ...prev]);
      setConcepto("");
      setImporte("");
      toast.success("Movimiento registrado");
    } catch (e: any) {
      toast.error(e.message || "Error al crear movimiento");
    } finally {
      setSubmitting(false);
    }
  }, [origen, destino, concepto, importe, fecha, ejercicio]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch("/.netlify/functions/deleteMovimientoCartera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      setMovimientos((prev) => prev.filter((m) => m.id !== id));
      toast.success("Movimiento eliminado");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  }, []);

  const handleSaveAhorro = useCallback(async () => {
    const val = parseFloat(ahorroInput.replace(",", "."));
    if (!Number.isFinite(val)) {
      toast.error("Importe inválido");
      return;
    }
    try {
      const res = await fetch("/.netlify/functions/updateAhorroCartera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importe: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setAhorroBase(Number(data.importe));
      setEditingAhorro(false);
      toast.success("Ahorro actualizado");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar ahorro");
    }
  }, [ahorroInput]);

  const walletIds: CarteraId[] = ["inversiones", "familiar", "sanyus", "ahorro"];

  const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return (
    <div className="space-y-6">
      {/* Wallet balance cards — real vs virtual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {walletIds.map((id) => {
          const Icon = CARTERA_ICONS[id];
          const real = id === "ahorro" ? ahorroBase : walletIngresos[id];
          const virtual = balances[id];
          const diff = virtual - real;
          return (
            <Card key={id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {CARTERA_LABELS[id]}
                  </span>
                  {id === "ahorro" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground"
                      onClick={() => {
                        setAhorroInput(String(ahorroBase));
                        setEditingAhorro(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {id === "ahorro" && editingAhorro ? (
                  <div className="flex gap-1">
                    <Input
                      className="h-8 text-sm"
                      value={ahorroInput}
                      onChange={(e) => setAhorroInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveAhorro();
                        if (e.key === "Escape") setEditingAhorro(false);
                      }}
                      autoFocus
                    />
                    <Button size="sm" className="h-8" onClick={handleSaveAhorro}>
                      OK
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p data-money className="text-2xl font-semibold tabular-nums">
                      {formatEuro(real)}
                    </p>
                    {diff !== 0 && (
                      <p
                        data-money
                        className={`text-sm tabular-nums mt-1 ${
                          diff > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        Previsión: {formatEuro(virtual)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly breakdown table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Desglose mensual</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">Cartera</TableHead>
                {MONTH_LABELS.map((m) => (
                  <TableHead key={m} className="text-right min-w-[80px]">{m}</TableHead>
                ))}
                <TableHead className="text-right min-w-[90px] font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletIds.map((id) => {
                const months = walletMonthly[id];
                const total = months.reduce((a, b) => a + b, 0);
                return (
                  <TableRow key={id}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium text-sm">
                      {CARTERA_LABELS[id]}
                    </TableCell>
                    {months.map((val, i) => (
                      <TableCell key={i} className="text-right text-sm tabular-nums" data-money>
                        {val === 0 ? <span className="text-muted-foreground">—</span> : formatEuro(val)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-sm tabular-nums font-semibold" data-money>
                      {formatEuro(total)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals row */}
              <TableRow className="border-t-2">
                <TableCell className="sticky left-0 bg-background z-10 font-semibold text-sm">
                  Total
                </TableCell>
                {MONTH_LABELS.map((_, i) => {
                  const colTotal = walletIds.reduce((sum, id) => sum + walletMonthly[id][i], 0);
                  return (
                    <TableCell key={i} className="text-right text-sm tabular-nums font-semibold" data-money>
                      {formatEuro(colTotal)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right text-sm tabular-nums font-semibold" data-money>
                  {formatEuro(walletIds.reduce((sum, id) => sum + walletMonthly[id].reduce((a, b) => a + b, 0), 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movement form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Nuevo movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[130px]">
              <label className="text-xs text-muted-foreground mb-1 block">Origen</label>
              <Select value={origen} onValueChange={(v) => { setOrigen(v as CarteraId); if (v === destino) setDestino(""); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent>
                  {CARTERA_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mb-2" />

            <div className="min-w-[130px]">
              <label className="text-xs text-muted-foreground mb-1 block">Destino</label>
              <Select value={destino} onValueChange={(v) => setDestino(v as CarteraId)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  {CARTERA_OPTIONS.filter((o) => o.value !== origen).map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-muted-foreground mb-1 block">Concepto</label>
              <Input
                className="h-9"
                placeholder="Concepto"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
              />
            </div>

            <div className="w-[120px]">
              <label className="text-xs text-muted-foreground mb-1 block">Importe</label>
              <Input
                className="h-9"
                placeholder="0,00"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
              />
            </div>

            <div className="w-[150px]">
              <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
              <Input
                type="date"
                className="h-9"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <Button className="h-9" onClick={handleCreate} disabled={submitting}>
              Mover
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historical log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {movimientos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin movimientos registrados
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead>Movimiento</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right w-[120px]">Importe</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-sm tabular-nums">
                      {new Date(mov.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{CARTERA_LABELS[mov.origen]}</span>
                      <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" />
                      <span className="font-medium">{CARTERA_LABELS[mov.destino]}</span>
                    </TableCell>
                    <TableCell className="text-sm">{mov.concepto}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums" data-money>
                      {formatEuro(mov.importe)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: mov.id, concepto: mov.concepto })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <ConfirmDeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Eliminar movimiento"
            description={`¿Eliminar el movimiento "${deleteTarget?.concepto}"?`}
            confirmWord={deleteTarget?.concepto || ""}
            onConfirm={async () => {
              if (deleteTarget) await handleDelete(deleteTarget.id);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
