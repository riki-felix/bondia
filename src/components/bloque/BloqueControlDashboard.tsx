// src/components/bloque/BloqueControlDashboard.tsx
import { useState } from "react";
import { TrendingDown, TrendingUp, CalendarClock, Landmark, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  type BloqueGasto,
  type BloqueIngreso,
  type BloqueOverride,
  type BloqueArea,
  type BloqueAreaCategoria,
  MESES_LABELS,
  calcularImporteMes,
  buildOverridesMap,
} from "@/lib/bloqueTypes";
import { formatEuro } from "@/lib/money";

interface Props {
  blockId: "casa" | "sanyus";
  gastos: BloqueGasto[];
  gastosOverrides: BloqueOverride[];
  ingresos: BloqueIngreso[];
  ingresosOverrides: BloqueOverride[];
  ejercicio: number;
  mesActual: number; // 1-12
  areas: BloqueArea[];
  areaAssignments: BloqueAreaCategoria[];
  inmueblesStats?: {
    count: number;
    totalCompra: number;
    totalEstimado: number;
  };
}

export default function BloqueControlDashboard({
  blockId,
  gastos,
  gastosOverrides,
  ingresos,
  ingresosOverrides,
  ejercicio,
  mesActual,
  areas,
  areaAssignments,
  inmueblesStats,
}: Props) {
  const gastosMap = buildOverridesMap(gastosOverrides, "gasto_id");
  const ingresosMap = buildOverridesMap(ingresosOverrides, "ingreso_id");

  // ── Widget 1: Este mes sale ─────────────────────────────────
  let totalGastosMes = 0;
  for (const g of gastos) {
    const v = calcularImporteMes(g, mesActual, ejercicio, gastosMap);
    if (v != null) totalGastosMes += v;
  }

  // ── Widget 2: Este mes entra ────────────────────────────────
  let totalIngresosMes = 0;
  for (const ing of ingresos) {
    const v = calcularImporteMes(ing, mesActual, ejercicio, ingresosMap);
    if (v != null) totalIngresosMes += v;
  }

  // ── Widget 3: Próximos pagos ────────────────────────────────
  type UpcomingPayment = { concepto: string; mes: number; importe: number };
  const upcoming: UpcomingPayment[] = [];

  for (const g of gastos) {
    if (g.frecuencia === "variable" || g.frecuencia === "puntual") continue;
    for (let m = mesActual; m <= 12; m++) {
      const v = calcularImporteMes(g, m, ejercicio, gastosMap);
      if (v != null && v > 0) {
        upcoming.push({ concepto: g.concepto, mes: m, importe: v });
      }
    }
  }

  upcoming.sort((a, b) => a.mes - b.mes || b.importe - a.importe);
  const next5 = upcoming.slice(0, 5);

  // ── Widget 4: Calendario fiscal ─────────────────────────────
  const finanzasArea = areas.find(
    (a) => a.slug === "finanzas" || a.nombre.toLowerCase() === "finanzas"
  );

  const finanzasCatIds = new Set(
    finanzasArea
      ? areaAssignments
          .filter((aa) => aa.area_id === finanzasArea.id && aa.tipo === "gasto")
          .map((aa) => aa.categoria_id)
      : []
  );

  const finanzasGastos = finanzasCatIds.size > 0
    ? gastos.filter((g) => g.categoria_id && finanzasCatIds.has(g.categoria_id))
    : [];

  type MonthBlock = { mes: number; total: number; top3: { concepto: string; importe: number }[] };
  const monthBlocks: MonthBlock[] = [];

  for (let m = 1; m <= 12; m++) {
    const items: { concepto: string; importe: number }[] = [];
    let total = 0;
    for (const g of finanzasGastos) {
      const v = calcularImporteMes(g, m, ejercicio, gastosMap);
      if (v != null && v > 0) {
        items.push({ concepto: g.concepto, importe: v });
        total += v;
      }
    }
    if (total > 0) {
      items.sort((a, b) => b.importe - a.importe);
      monthBlocks.push({ mes: m, total, top3: items.slice(0, 3) });
    }
  }

  const balance = totalIngresosMes - totalGastosMes;

  // ── Widget 5: Ranking (Vida Diaria para Casa, Alquiler ingresos para Sanyus)
  type RankingItem = { concepto: string; total: number };

  const rankingAnualMap = new Map<string, number>();
  const rankingMesMap = new Map<string, number>();
  let rankingTitle = "Ranking Vida Diaria";
  let rankingEmptyMsg = "Crea un área «Vida Diaria» y asigna categorías de gasto para ver el ranking.";

  if (blockId === "sanyus") {
    // Sanyus: ranking de ingresos de la categoría Alquiler
    rankingTitle = "Ranking Alquiler";
    rankingEmptyMsg = "No hay ingresos en la categoría «Alquiler».";

    const alquilerIngresos = ingresos.filter(
      (ing) => ing.categoria_nombre?.toLowerCase() === "alquiler"
    );

    for (const ing of alquilerIngresos) {
      let sumAnual = 0;
      for (let m = 1; m <= 12; m++) {
        const v = calcularImporteMes(ing, m, ejercicio, ingresosMap);
        if (v != null) sumAnual += v;
      }
      if (sumAnual > 0) {
        rankingAnualMap.set(ing.concepto, (rankingAnualMap.get(ing.concepto) ?? 0) + sumAnual);
      }

      const vMes = calcularImporteMes(ing, mesActual, ejercicio, ingresosMap);
      if (vMes != null && vMes > 0) {
        rankingMesMap.set(ing.concepto, (rankingMesMap.get(ing.concepto) ?? 0) + vMes);
      }
    }
  } else {
    // Casa: ranking de gastos del área Vida Diaria
    const vidaDiariaArea = areas.find(
      (a) => a.slug === "vida-diaria" || a.nombre.toLowerCase() === "vida diaria"
    );

    const vidaDiariaCatIds = new Set(
      vidaDiariaArea
        ? areaAssignments
            .filter((aa) => aa.area_id === vidaDiariaArea.id && aa.tipo === "gasto")
            .map((aa) => aa.categoria_id)
        : []
    );

    const vidaDiariaGastos = vidaDiariaCatIds.size > 0
      ? gastos.filter((g) => g.categoria_id && vidaDiariaCatIds.has(g.categoria_id))
      : [];

    for (const g of vidaDiariaGastos) {
      let sumAnual = 0;
      for (let m = 1; m <= 12; m++) {
        const v = calcularImporteMes(g, m, ejercicio, gastosMap);
        if (v != null) sumAnual += v;
      }
      if (sumAnual > 0) {
        rankingAnualMap.set(g.concepto, (rankingAnualMap.get(g.concepto) ?? 0) + sumAnual);
      }

      const vMes = calcularImporteMes(g, mesActual, ejercicio, gastosMap);
      if (vMes != null && vMes > 0) {
        rankingMesMap.set(g.concepto, (rankingMesMap.get(g.concepto) ?? 0) + vMes);
      }
    }
  }

  const buildRanking = (map: Map<string, number>): RankingItem[] =>
    Array.from(map.entries())
      .map(([concepto, total]) => ({ concepto, total }))
      .sort((a, b) => b.total - a.total);

  const rankingAnual = buildRanking(rankingAnualMap);
  const rankingMes = buildRanking(rankingMesMap);

  const BAR_COLORS = [
    "bg-stone-700", "bg-stone-600", "bg-stone-500",
    "bg-stone-400", "bg-stone-400/80", "bg-stone-400/60",
    "bg-stone-300", "bg-stone-300/80", "bg-stone-300/60",
    "bg-stone-200", "bg-stone-200/80", "bg-stone-200/60",
  ];

  return (
    <div className="space-y-6">
      {/* ── Row 1: Resumen del mes ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Este mes sale</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatEuro(totalGastosMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {MESES_LABELS[mesActual - 1]} {ejercicio}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Este mes entra</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatEuro(totalIngresosMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {MESES_LABELS[mesActual - 1]} {ejercicio}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatEuro(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {MESES_LABELS[mesActual - 1]} {ejercicio}
            </p>
          </CardContent>
        </Card>
      </div>

      {blockId === "sanyus" && inmueblesStats && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Inmuebles</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-2xl font-bold">{inmueblesStats.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {inmueblesStats.count === 1 ? "inmueble registrado" : "inmuebles registrados"}
                </p>
                {inmueblesStats.totalCompra > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Coste: <strong>{formatEuro(inmueblesStats.totalCompra)}</strong>
                    {inmueblesStats.totalEstimado > 0 && (
                      <> · Estimado: <strong>{formatEuro(inmueblesStats.totalEstimado)}</strong></>
                    )}
                  </p>
                )}
              </div>
              <a
                href="/sanyus/activos?inmueble=1"
                className="text-sm text-primary hover:underline"
              >
                Ver listado
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Row 2: Próximos pagos + Ranking Vida Diaria ─────── */}
      <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Próximos pagos</CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {next5.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pagos pendientes</p>
          ) : (
            <ul className="space-y-3">
              {next5.map((p, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{p.concepto}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {MESES_LABELS[p.mes - 1]}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{formatEuro(p.importe)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <RankingCard
        title={rankingTitle}
        emptyMessage={rankingEmptyMsg}
        rankingAnual={rankingAnual}
        rankingMes={rankingMes}
        mesLabel={MESES_LABELS[mesActual - 1]}
        barColors={BAR_COLORS}
      />
      </div>

      {/* ── Row 3: Calendario fiscal ───────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Calendario fiscal</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {finanzasGastos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crea un área «Finanzas» y asigna categorías de gasto para ver el calendario fiscal.
            </p>
          ) : monthBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin gastos fiscales este año.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {monthBlocks.map((block) => (
                <div
                  key={block.mes}
                  className={`rounded-lg border p-3 ${
                    block.mes === mesActual
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      {MESES_LABELS[block.mes - 1]}
                    </span>
                    <span className="text-sm font-bold">{formatEuro(block.total)}</span>
                  </div>
                  <ul className="space-y-1">
                    {block.top3.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-xs text-muted-foreground"
                      >
                        <span className="truncate mr-2">{item.concepto}</span>
                        <span className="whitespace-nowrap">{formatEuro(item.importe)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-component: Ranking with month/annual toggle ─────────

function RankingCard({
  title,
  emptyMessage,
  rankingAnual,
  rankingMes,
  mesLabel,
  barColors,
}: {
  title: string;
  emptyMessage: string;
  rankingAnual: { concepto: string; total: number }[];
  rankingMes: { concepto: string; total: number }[];
  mesLabel: string;
  barColors: string[];
}) {
  const [mode, setMode] = useState<"anual" | "mes">("anual");
  const ranking = mode === "anual" ? rankingAnual : rankingMes;
  const max = ranking.length > 0 ? ranking[0].total : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-0.5 rounded-md border p-0.5 text-xs">
          <button
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === "mes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("mes")}
          >
            {mesLabel}
          </button>
          <button
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === "anual"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("anual")}
          >
            Anual
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {rankingAnual.length === 0 && rankingMes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin gastos este mes.</p>
        ) : (
          <ul className="space-y-2">
            {ranking.map((item, i) => {
              const pct = max > 0 ? (item.total / max) * 100 : 0;
              const color = barColors[Math.min(i, barColors.length - 1)];
              return (
                <li key={i}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium truncate mr-2">{item.concepto}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatEuro(item.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/40">
                    <div
                      className={`h-2 rounded-full ${color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
