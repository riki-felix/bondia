import { useMemo, useState, type ReactNode } from "react";
import { BarChart3, CheckCircle, Circle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { BeneficioMedioCard } from "./BeneficioMedioCard";
import { PropiedadesPorAnioChart } from "./PropiedadesPorAnioChart";
import type { InformesProperty } from "@/lib/informesStats";
import {
  collectInformesYears,
  computeInformesStats,
  computeMargenPct,
  computePreciosMedios,
  computeYearOverYearPct,
  filterInformesRows,
  filterInformesRowsForPreciosMedios,
} from "@/lib/informesStats";
import {
  formatEuro,
  formatMoneyEdit,
  normalizeMoneyText,
  parseMoneyInput,
} from "@/lib/moneyCalc";
import { propertyIsLiquidada } from "@/lib/fetchInversionesWithLiquidaciones";
import { useInvertido } from "@/lib/invertidoStorage";

interface InformesDashboardProps {
  initialData: InformesProperty[];
  lastUpdatedAt: string | null;
  objetivoBeneficioMedio: number | null;
}

function formatLastUpdated(iso: string | null): string {
  if (!iso) return "Sin datos";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function InformesBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default function InformesDashboard({
  initialData,
  lastUpdatedAt,
  objetivoBeneficioMedio,
}: InformesDashboardProps) {
  const years = useMemo(() => collectInformesYears(initialData), [initialData]);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [showLiquidadas, setShowLiquidadas] = useState(false);
  const [showSinLiquidacion, setShowSinLiquidacion] = useState(false);
  const { invertido, saveInvertido } = useInvertido();
  const [editingInvertido, setEditingInvertido] = useState(false);
  const [invertidoInput, setInvertidoInput] = useState("");

  const liquidadasCount = useMemo(
    () => initialData.filter((r) => propertyIsLiquidada(r)).length,
    [initialData]
  );
  const sinLiquidadasCount = useMemo(
    () => initialData.filter((r) => !propertyIsLiquidada(r)).length,
    [initialData]
  );

  const viewRows = useMemo(
    () =>
      filterInformesRows(
        initialData,
        yearFilter,
        showLiquidadas,
        showSinLiquidacion
      ),
    [initialData, yearFilter, showLiquidadas, showSinLiquidacion]
  );

  const stats = useMemo(() => computeInformesStats(viewRows), [viewRows]);
  const preciosMediosRows = useMemo(
    () =>
      filterInformesRowsForPreciosMedios(
        initialData,
        yearFilter,
        showLiquidadas,
        showSinLiquidacion
      ),
    [initialData, yearFilter, showLiquidadas, showSinLiquidacion]
  );
  const preciosMedios = useMemo(
    () => computePreciosMedios(preciosMediosRows),
    [preciosMediosRows]
  );
  const margen = computeMargenPct(stats.transferenciaTotal, invertido);

  const prevYearRows = useMemo(() => {
    if (yearFilter === "all") return null;
    return filterInformesRows(
      initialData,
      String(Number(yearFilter) - 1),
      showLiquidadas,
      showSinLiquidacion
    );
  }, [initialData, yearFilter, showLiquidadas, showSinLiquidacion]);

  const prevStats = useMemo(
    () => (prevYearRows ? computeInformesStats(prevYearRows) : null),
    [prevYearRows]
  );
  const prevPreciosMedios = useMemo(() => {
    if (yearFilter === "all") return null;
    const rows = filterInformesRowsForPreciosMedios(
      initialData,
      String(Number(yearFilter) - 1),
      showLiquidadas,
      showSinLiquidacion
    );
    return computePreciosMedios(rows);
  }, [initialData, yearFilter, showLiquidadas, showSinLiquidacion]);
  const prevMargen = useMemo(
    () =>
      prevStats
        ? computeMargenPct(prevStats.transferenciaTotal, invertido)
        : null,
    [prevStats, invertido]
  );

  const showYearComparison = yearFilter !== "all";
  const yoy = (current: number | null, previous: number | null) =>
    showYearComparison ? computeYearOverYearPct(current, previous) : null;

  const propiedadesEnVista = useMemo(
    () => viewRows.filter((r) => r.estado !== "borrador").length,
    [viewRows]
  );
  const prevPropiedadesEnVista = useMemo(
    () =>
      prevYearRows
        ? prevYearRows.filter((r) => r.estado !== "borrador").length
        : null,
    [prevYearRows]
  );

  const handleInvertidoSave = () => {
    const trimmed = invertidoInput.trim();
    const parsed =
      trimmed === ""
        ? 0
        : parseMoneyInput(normalizeMoneyText(trimmed)) ?? 0;
    saveInvertido(parsed);
    setEditingInvertido(false);
  };

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Informes</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Última actualización: {formatLastUpdated(lastUpdatedAt)}
          </p>
        </div>

        <div className="rounded-lg border bg-card px-4 py-3 min-w-[200px]">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            Invertido
            <Pencil className="h-3 w-3" />
          </p>
          {editingInvertido ? (
            <Input
              autoFocus
              className="mt-1 h-8 text-lg font-semibold tabular-nums"
              value={invertidoInput}
              onChange={(e) => setInvertidoInput(e.target.value)}
              onBlur={handleInvertidoSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInvertidoSave();
                if (e.key === "Escape") setEditingInvertido(false);
              }}
            />
          ) : (
            <button
              type="button"
              data-money
              className="mt-0.5 text-xl font-semibold tabular-nums hover:text-primary transition-colors"
              onClick={() => {
                setInvertidoInput(
                  invertido ? formatMoneyEdit(invertido) : ""
                );
                setEditingInvertido(true);
              }}
            >
              {formatEuro(invertido)}
            </button>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">Clic para editar</p>
        </div>
      </div>

      {/* Vistas */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={yearFilter === "all" ? "default" : "outline"}
          onClick={() => setYearFilter("all")}
        >
          Todos
        </Button>
        {years.map((y) => (
          <Button
            key={y}
            size="sm"
            variant={yearFilter === String(y) ? "default" : "outline"}
            onClick={() => setYearFilter(String(y))}
          >
            {y}
          </Button>
        ))}
        <span className="mx-1 hidden sm:inline text-muted-foreground">|</span>
        <Button
          size="sm"
          variant={showLiquidadas ? "default" : "outline"}
          onClick={() => {
            setShowLiquidadas((v) => {
              const next = !v;
              if (next) setShowSinLiquidacion(false);
              return next;
            });
          }}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Con liquidación
          {liquidadasCount > 0 ? ` (${liquidadasCount})` : ""}
        </Button>
        <Button
          size="sm"
          variant={showSinLiquidacion ? "default" : "outline"}
          onClick={() => {
            setShowSinLiquidacion((v) => {
              const next = !v;
              if (next) setShowLiquidadas(false);
              return next;
            });
          }}
        >
          <Circle className="h-4 w-4 mr-1" />
          Sin liquidación
          {sinLiquidadasCount > 0 ? ` (${sinLiquidadasCount})` : ""}
        </Button>
      </div>

      {/* Bloque 1 — Beneficios */}
      <InformesBlock title="Beneficios">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Beneficio neto"
            value={formatEuro(stats.beneficioNeto)}
            description="Suma de ingresos en banco"
            variant="highlight"
            yearComparisonPct={yoy(stats.beneficioNeto, prevStats?.beneficioNeto ?? null)}
          />
          <StatCard
            label="Beneficio bruto"
            value={formatEuro(stats.beneficioBruto)}
            description="Ingresos en banco + retenciones"
            yearComparisonPct={yoy(stats.beneficioBruto, prevStats?.beneficioBruto ?? null)}
          />
          <BeneficioMedioCard
            beneficioMedio={stats.beneficioMedio}
            operacionesLiquidadas={stats.operacionesLiquidadas}
            objetivoBeneficioMedio={objetivoBeneficioMedio}
            yearComparisonPct={yoy(
              stats.beneficioMedio,
              prevStats?.beneficioMedio ?? null
            )}
          />
        </div>
      </InformesBlock>

      {/* Bloque 2 — Participación */}
      <InformesBlock title="Participación">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Aportación"
            value={formatEuro(stats.aportacion)}
            description="Suma de aportaciones"
            yearComparisonPct={yoy(stats.aportacion, prevStats?.aportacion ?? null)}
          />
          <StatCard
            label="Retribución"
            value={formatEuro(stats.retribucion)}
            description="Suma de retribuciones"
            yearComparisonPct={yoy(stats.retribucion, prevStats?.retribucion ?? null)}
          />
          <StatCard
            label="JASP total"
            value={formatEuro(stats.jaspTotal)}
            description="Suma de JASP"
            yearComparisonPct={yoy(stats.jaspTotal, prevStats?.jaspTotal ?? null)}
          />
          <StatCard
            label="Margen"
            value={margen != null ? `${margen}%` : "—"}
            description="Transferencias / Invertido"
            variant="muted"
            yearComparisonPct={yoy(margen, prevMargen)}
          />
        </div>
      </InformesBlock>

      {/* Bloque 3 — Fiscal */}
      <InformesBlock title="Fiscal">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Total retenciones"
            value={formatEuro(stats.retencionesTotal)}
            description="19% sobre retribuciones"
            yearComparisonPct={yoy(
              stats.retencionesTotal,
              prevStats?.retencionesTotal ?? null
            )}
          />
          <StatCard
            label="No deducible (efectivo)"
            value={formatEuro(stats.efectivoTotal)}
            description="Suma de efectivo"
            variant="muted"
            yearComparisonPct={yoy(stats.efectivoTotal, prevStats?.efectivoTotal ?? null)}
          />
        </div>
      </InformesBlock>

      {/* Bloque 5 — Propiedades */}
      <InformesBlock title="Propiedades">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Propiedades por año
            </p>
            <PropiedadesPorAnioChart
              data={stats.propiedadesPorAnio}
              totalCount={showYearComparison ? propiedadesEnVista : undefined}
              yearComparisonPct={yoy(
                propiedadesEnVista,
                prevPropiedadesEnVista
              )}
            />
          </div>
          <div className="space-y-4">
            <StatCard
              label="Precio medio compra"
              value={
                preciosMedios.precioMedioCompra != null
                  ? formatEuro(preciosMedios.precioMedioCompra)
                  : "—"
              }
              description={
                preciosMedios.comprasEnVista > 0
                  ? yearFilter !== "all"
                    ? `${preciosMedios.comprasEnVista} en ejercicio ${yearFilter}`
                    : `${preciosMedios.comprasEnVista} con precio de compra`
                  : yearFilter !== "all"
                    ? `Sin precios en ejercicio ${yearFilter}`
                    : "Sin precios de compra en esta vista"
              }
              yearComparisonPct={yoy(
                preciosMedios.precioMedioCompra,
                prevPreciosMedios?.precioMedioCompra ?? null
              )}
            />
            <StatCard
              label="Precio medio venta"
              value={
                preciosMedios.precioMedioVenta != null
                  ? formatEuro(preciosMedios.precioMedioVenta)
                  : "—"
              }
              description={
                preciosMedios.ventasEnVista > 0
                  ? yearFilter !== "all"
                    ? `${preciosMedios.ventasEnVista} en ejercicio ${yearFilter}`
                    : `${preciosMedios.ventasEnVista} con precio de venta`
                  : yearFilter !== "all"
                    ? `Sin precios en ejercicio ${yearFilter}`
                    : "Sin precios de venta en esta vista"
              }
              yearComparisonPct={yoy(
                preciosMedios.precioMedioVenta,
                prevPreciosMedios?.precioMedioVenta ?? null
              )}
            />
          </div>
        </div>
      </InformesBlock>
    </div>
  );
}
