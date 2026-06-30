import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEuro } from "@/lib/money";
import {
  sumIngresosBancoPropiedades,
  type IngresoBancoPropiedadRow,
} from "@/lib/ingresosBancoAggregate";

interface Props {
  propiedades: IngresoBancoPropiedadRow[];
  years: number[];
  defaultYear: number;
}

export function IngresosBancoWidget({
  propiedades,
  years,
  defaultYear,
}: Props) {
  const [yearFilter, setYearFilter] = useState(String(defaultYear));

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = years.length > 0 ? Math.min(...years) : currentYear;
    const opts: { value: string; label: string }[] = [];
    for (let y = currentYear; y >= minYear; y--) {
      opts.push({ value: String(y), label: String(y) });
    }
    return opts;
  }, [years]);

  const { total, count } = useMemo(
    () => sumIngresosBancoPropiedades(propiedades, yearFilter),
    [propiedades, yearFilter]
  );

  const filterLabel =
    yearFilter === "all" ? "Todos los años" : `Ejercicio ${yearFilter}`;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold">Ingresos en banco</h3>
            <p className="text-sm text-muted-foreground">
              Suma de transferencias en inversiones (ingreso en banco)
            </p>
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {yearOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p data-money className="text-4xl font-bold tabular-nums text-primary">
          {formatEuro(total)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {count === 0
            ? `Sin transferencias en ${filterLabel.toLowerCase()}`
            : `${count} ${count === 1 ? "operación" : "operaciones"} · ${filterLabel}`}
        </p>
      </CardContent>
    </Card>
  );
}
