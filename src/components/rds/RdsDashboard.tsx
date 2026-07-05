import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import { EditableCell } from "@/components/inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { formatEuro, formatEuroPlain } from "@/lib/money";
import { roundMoney2 } from "@/lib/moneyCalc";
import { saveRdsPromo } from "@/lib/rdsApi";
import {
  beneficioFromResumen,
  buildMesesResumen,
  promoByMesMap,
  resumenGlobal,
  resumenPorPiso,
} from "@/lib/rdsStats";
import type { RdsMovimiento, RdsPiso, RdsPromo } from "@/lib/rdsTypes";
import { RDS_MESES_CORTOS } from "@/lib/rdsTypes";
import { RdsCreatePisoDialog } from "./RdsCreatePisoDialog";
import { RdsPisoRow } from "./RdsPisoRow";
import { RdsYearSelect } from "./RdsYearSelect";
import { cn } from "@/lib/utils";

interface RdsDashboardProps {
  pisos: RdsPiso[];
  movimientos: RdsMovimiento[];
  promos: RdsPromo[];
  selectedYear: number;
}

function upsertMovimiento(
  movs: RdsMovimiento[],
  pisoId: string,
  anio: number,
  mes: number,
  gasto: number,
  ingreso: number
): RdsMovimiento[] {
  const idx = movs.findIndex(
    (m) => m.piso_id === pisoId && Number(m.anio) === anio && m.mes === mes
  );
  if (idx >= 0) {
    const next = [...movs];
    next[idx] = { ...next[idx], gasto, ingreso };
    return next;
  }
  return [
    ...movs,
    {
      id: `local-${pisoId}-${anio}-${mes}`,
      piso_id: pisoId,
      anio,
      mes,
      gasto,
      ingreso,
      promocion: 0,
    },
  ];
}

export default function RdsDashboard({
  pisos: initialPisos,
  movimientos: initialMovimientos,
  promos: initialPromos,
  selectedYear,
}: RdsDashboardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [pisos, setPisos] = useState(initialPisos);
  const [movimientos, setMovimientos] = useState(initialMovimientos);
  const [promos, setPromos] = useState(initialPromos);
  const [promoValues, setPromoValues] = useState<Record<number, number>>(() =>
    promoByMesMap(initialPromos)
  );

  useEffect(() => {
    setPisos(initialPisos);
  }, [initialPisos]);

  useEffect(() => {
    setMovimientos(initialMovimientos);
  }, [initialMovimientos]);

  useEffect(() => {
    setPromos(initialPromos);
    setPromoValues(promoByMesMap(initialPromos));
  }, [initialPromos]);

  const resumen = useMemo(
    () => resumenGlobal(movimientos, promos),
    [movimientos, promos]
  );
  const { beneficio, beneficioAjustado, miParte } = useMemo(
    () => beneficioFromResumen(resumen),
    [resumen]
  );
  const mesesResumen = useMemo(
    () => buildMesesResumen(movimientos, promos, selectedYear),
    [movimientos, promos, selectedYear]
  );
  const resumenPisos = useMemo(
    () => resumenPorPiso(movimientos, selectedYear),
    [movimientos, selectedYear]
  );

  const pisoIdsConMovs = useMemo(() => {
    const ids = new Set<string>();
    for (const m of movimientos) {
      if (Number(m.anio) === selectedYear) ids.add(m.piso_id);
    }
    return ids;
  }, [movimientos, selectedYear]);

  const handleMovimientoSaved = useCallback(
    (pisoId: string, mes: number, gasto: number, ingreso: number) => {
      setMovimientos((prev) =>
        upsertMovimiento(prev, pisoId, selectedYear, mes, gasto, ingreso)
      );
    },
    [selectedYear]
  );

  const handlePisoUpdated = useCallback((updated: RdsPiso) => {
    setPisos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handlePisoDeleted = useCallback((pisoId: string) => {
    setPisos((prev) => prev.filter((p) => p.id !== pisoId));
    setMovimientos((prev) => prev.filter((m) => m.piso_id !== pisoId));
  }, []);

  const savePromoMes = useCallback(
    async (mes: number, newValue: number) => {
      const prev = promoValues[mes] ?? 0;
      const normalized = roundMoney2(newValue);
      if (roundMoney2(prev) === normalized) return;

      setPromoValues((current) => ({ ...current, [mes]: normalized }));

      try {
        await saveRdsPromo({
          anio: selectedYear,
          meses: [{ mes, importe: normalized }],
        });
        setPromos((current) => {
          const idx = current.findIndex(
            (p) => Number(p.anio) === selectedYear && p.mes === mes
          );
          if (idx >= 0) {
            const next = [...current];
            next[idx] = { ...next[idx], importe: normalized };
            return next;
          }
          return [
            ...current,
            {
              id: `local-promo-${selectedYear}-${mes}`,
              anio: selectedYear,
              mes,
              importe: normalized,
            },
          ];
        });
      } catch (e) {
        setPromoValues((current) => ({ ...current, [mes]: prev }));
        toast.error(e instanceof Error ? e.message : "Error al guardar promoción");
      }
    },
    [promoValues, selectedYear]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RDS</h1>
          <p className="text-sm text-muted-foreground">
            Pisos en alquiler · {selectedYear}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RdsYearSelect
            value={selectedYear}
            navigateTo="/rds"
            extraYears={movimientos.map((m) => m.anio)}
          />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo piso
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Mi parte"
          value={formatEuro(miParte)}
          description={`Beneficio real: ${formatEuro(beneficioAjustado)}`}
          variant="highlight"
        />
        <StatCard
          label="Beneficio"
          value={formatEuro(beneficio)}
          description="Beneficio sin descontar promoción"
        />
        <StatCard label="Ingresos" value={formatEuro(resumen.totalIngresos)} />
        <StatCard
          label="Gastos + promo"
          value={formatEuro(resumen.totalGastos + resumen.totalPromos)}
          description={`Promo: ${formatEuro(resumen.totalPromos)}`}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Calendario {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28" />
                {RDS_MESES_CORTOS.map((m) => (
                  <TableHead key={m} className="text-center text-xs">
                    {m}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Balance</TableCell>
                {mesesResumen.map((m) => (
                  <TableCell
                    key={m.mes}
                    data-money
                    className={cn(
                      "text-center text-xs tabular-nums",
                      m.balanceAjustado >= 0 ? "text-emerald-700" : "text-red-700"
                    )}
                  >
                    {formatEuroPlain(m.balanceAjustado)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Mi parte</TableCell>
                {mesesResumen.map((m) => (
                  <TableCell
                    key={m.mes}
                    data-money
                    className="text-center text-xs tabular-nums text-muted-foreground"
                  >
                    {formatEuroPlain(m.miParte)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pisos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Despliega un piso para editar sus movimientos mensuales.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {pisos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay pisos registrados. Crea el primero.
            </p>
          ) : (
            pisos.map((piso) => (
              <RdsPisoRow
                key={piso.id}
                piso={piso}
                movimientos={movimientos}
                selectedYear={selectedYear}
                initialResumen={
                  resumenPisos[piso.id] ?? { gastos: 0, ingresos: 0, beneficio: 0 }
                }
                tieneDatos={pisoIdsConMovs.has(piso.id)}
                onMovimientoSaved={(mes, gasto, ingreso) =>
                  handleMovimientoSaved(piso.id, mes, gasto, ingreso)
                }
                onPisoUpdated={handlePisoUpdated}
                onPisoDeleted={handlePisoDeleted}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gastos de promoción</CardTitle>
          <p className="text-sm text-muted-foreground">
            Importes globales mensuales, no asociados a un piso concreto.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24" />
                {RDS_MESES_CORTOS.map((m) => (
                  <TableHead key={m} className="text-center text-xs">
                    {m}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm font-medium">Promo</TableCell>
                {Array.from({ length: 12 }, (_, idx) => {
                  const mes = idx + 1;
                  return (
                    <TableCell key={mes} className="p-1">
                      <EditableCell
                        value={promoValues[mes] ?? 0}
                        type="money"
                        className="min-w-[56px] text-xs"
                        onSave={(v) => void savePromoMes(mes, v as number)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RdsCreatePisoDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
