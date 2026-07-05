import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditableCell } from "@/components/inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { formatEuroPlain } from "@/lib/money";
import { roundMoney2 } from "@/lib/moneyCalc";
import { saveRdsMovimientos } from "@/lib/rdsApi";
import { mesesPorPiso } from "@/lib/rdsStats";
import type { RdsMovimiento, RdsPisoResumen } from "@/lib/rdsTypes";
import { RDS_MESES_CORTOS } from "@/lib/rdsTypes";

type MesValues = { gasto: number; ingreso: number };

function valuesFromMovs(
  movs: RdsMovimiento[],
  pisoId: string,
  anio: number
): Record<number, MesValues> {
  const out: Record<number, MesValues> = {};
  for (const m of mesesPorPiso(movs, pisoId, anio)) {
    out[m.mes] = { gasto: m.gasto, ingreso: m.ingreso };
  }
  return out;
}

function resumenFromValues(values: Record<number, MesValues>): RdsPisoResumen {
  let gastos = 0;
  let ingresos = 0;
  for (let mes = 1; mes <= 12; mes++) {
    const v = values[mes] ?? { gasto: 0, ingreso: 0 };
    gastos += v.gasto;
    ingresos += v.ingreso;
  }
  gastos = roundMoney2(gastos);
  ingresos = roundMoney2(ingresos);
  return {
    gastos,
    ingresos,
    beneficio: roundMoney2(ingresos - gastos),
  };
}

export interface RdsPisoMovimientosGridProps {
  pisoId: string;
  movimientos: RdsMovimiento[];
  selectedYear: number;
  showBalance?: boolean;
  onResumenChange?: (resumen: RdsPisoResumen) => void;
  onSaved?: (mes: number, gasto: number, ingreso: number) => void;
}

export function RdsPisoMovimientosGrid({
  pisoId,
  movimientos,
  selectedYear,
  showBalance = true,
  onResumenChange,
  onSaved,
}: RdsPisoMovimientosGridProps) {
  const [values, setValues] = useState<Record<number, MesValues>>(() =>
    valuesFromMovs(movimientos, pisoId, selectedYear)
  );

  useEffect(() => {
    setValues(valuesFromMovs(movimientos, pisoId, selectedYear));
  }, [movimientos, pisoId, selectedYear]);

  const resumen = useMemo(() => resumenFromValues(values), [values]);

  useEffect(() => {
    onResumenChange?.(resumen);
  }, [resumen, onResumenChange]);

  const saveField = useCallback(
    async (mes: number, field: "gasto" | "ingreso", newValue: number) => {
      const prev = values[mes] ?? { gasto: 0, ingreso: 0 };
      const normalized = roundMoney2(newValue);
      if (roundMoney2(prev[field]) === normalized) return;

      const next = { ...prev, [field]: normalized };
      setValues((current) => ({ ...current, [mes]: next }));

      try {
        await saveRdsMovimientos({
          piso_id: pisoId,
          anio: selectedYear,
          meses: [{ mes, gasto: next.gasto, ingreso: next.ingreso }],
        });
        onSaved?.(mes, next.gasto, next.ingreso);
      } catch (e) {
        setValues((current) => ({ ...current, [mes]: prev }));
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    },
    [values, pisoId, selectedYear, onSaved]
  );

  const mesesDisplay = useMemo(
    () => mesesPorPiso(movimientos, pisoId, selectedYear),
    [movimientos, pisoId, selectedYear]
  );

  const balanceByMes = useMemo(() => {
    const map = new Map<number, number>();
    for (let mes = 1; mes <= 12; mes++) {
      const v = values[mes] ?? { gasto: 0, ingreso: 0 };
      map.set(mes, roundMoney2(v.ingreso - v.gasto));
    }
    return map;
  }, [values]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20" />
          {RDS_MESES_CORTOS.map((m) => (
            <TableHead key={m} className="text-center text-xs">
              {m}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {(["gasto", "ingreso"] as const).map((row) => (
          <TableRow key={row}>
            <TableCell className="text-xs capitalize">{row}</TableCell>
            {Array.from({ length: 12 }, (_, idx) => {
              const mes = idx + 1;
              const cellValue = values[mes]?.[row] ?? 0;
              return (
                <TableCell key={mes} className="p-1">
                  <EditableCell
                    value={cellValue}
                    type="money"
                    className="min-w-[56px] text-xs"
                    onSave={(v) => void saveField(mes, row, v as number)}
                  />
                </TableCell>
              );
            })}
          </TableRow>
        ))}
        {showBalance && (
          <TableRow>
            <TableCell className="text-xs">Balance</TableCell>
            {mesesDisplay.map((m) => (
              <TableCell
                key={m.mes}
                data-money
                className="text-center text-xs tabular-nums"
              >
                {formatEuroPlain(balanceByMes.get(m.mes) ?? 0)}
              </TableCell>
            ))}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
