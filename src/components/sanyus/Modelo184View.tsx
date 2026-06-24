"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Save,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEuro } from "@/lib/money";
import {
  MODELO184_ACTIVIDAD_PRINCIPAL,
  SITUACION_INMUEBLE_OPTIONS,
  buildModelo184Resumen,
  campoLabel,
  parseParticipacionValor,
  type Modelo184ActivoInput,
  type Modelo184CaracteristicaInput,
} from "@/lib/modelo184";
import { formatParticipacionPct } from "@/lib/participacion";
import type { BloqueGasto, BloqueIngreso, BloqueOverride } from "@/lib/bloqueTypes";
import { INMUEBLE_FIELD_GROUPS } from "@/lib/sanyusInmueblePlantilla";
import {
  type Modelo184FichaConfig,
  MODELO184_TIPO_ENTIDAD_LABEL,
  rowFromFicha,
} from "@/lib/modelo184Config";

interface Props {
  ejercicio: number;
  initialFicha: Modelo184FichaConfig;
  saveConfigEndpoint: string;
  activos: Modelo184ActivoInput[];
  caracteristicas: Modelo184CaracteristicaInput[];
  gastos: BloqueGasto[];
  ingresos: BloqueIngreso[];
  gastosOverrides: BloqueOverride[];
  ingresosOverrides: BloqueOverride[];
  activoDetalleBase: string;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  const v = value?.trim();
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{v || "—"}</p>
    </div>
  );
}

export default function Modelo184View({
  ejercicio,
  initialFicha,
  saveConfigEndpoint,
  activos,
  caracteristicas,
  gastos,
  ingresos,
  gastosOverrides,
  ingresosOverrides,
  activoDetalleBase,
}: Props) {
  const [ficha, setFicha] = useState(initialFicha);
  const [saving, setSaving] = useState(false);

  const resumen = useMemo(
    () =>
      buildModelo184Resumen({
        ejercicio,
        ficha,
        activos,
        caracteristicas,
        gastos,
        ingresos,
        gastosOverrides,
        ingresosOverrides,
      }),
    [
      ejercicio,
      ficha,
      activos,
      caracteristicas,
      gastos,
      ingresos,
      gastosOverrides,
      ingresosOverrides,
    ]
  );

  const setEntidad = useCallback(
    (patch: Partial<Modelo184FichaConfig["entidad"]>) => {
      setFicha((prev) => ({
        ...prev,
        entidad: { ...prev.entidad, ...patch },
      }));
    },
    []
  );

  const setParticipeNif = useCallback((key: "carlos" | "laura" | "izan", nif: string) => {
    setFicha((prev) => ({
      ...prev,
      participes: prev.participes.map((p) => (p.key === key ? { ...p, nif } : p)),
    }));
  }, []);

  const handleSaveFicha = async () => {
    setSaving(true);
    try {
      const res = await fetch(saveConfigEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rowFromFicha(ficha)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const prevYear = ejercicio - 1;
  const nextYear = ejercicio + 1;
  const basePath = "/sanyus/modelo-184";

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="font-normal text-muted-foreground">Sanyus ·</span> Modelo 184
          </h1>
          <p className="text-sm text-muted-foreground">
            Ficha de configuración y datos del ejercicio {ejercicio} — comunidad de bienes en
            atribución de rentas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${basePath}?year=${prevYear}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
            aria-label="Ejercicio anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </a>
          <span className="min-w-[4rem] text-center text-sm font-medium">{ejercicio}</span>
          <a
            href={`${basePath}?year=${nextYear}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
            aria-label="Ejercicio siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {resumen.avisos.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Revisar antes de presentar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {resumen.avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="print:break-inside-avoid">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Configuración — entidad y partícipes
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveFicha}
            disabled={saving}
            className="print:hidden"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar ficha
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Tipo de entidad</Label>
              <Input
                readOnly
                className="bg-muted/50"
                value={MODELO184_TIPO_ENTIDAD_LABEL}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m184-nif">NIF entidad</Label>
              <Input
                id="m184-nif"
                value={ficha.entidad.nif}
                onChange={(e) => setEntidad({ nif: e.target.value })}
                className="font-mono"
                placeholder="B12345678"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="m184-denominacion">Denominación</Label>
              <Input
                id="m184-denominacion"
                value={ficha.entidad.denominacion}
                onChange={(e) => setEntidad({ denominacion: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="m184-domicilio">Domicilio fiscal</Label>
              <Input
                id="m184-domicilio"
                value={ficha.entidad.domicilio}
                onChange={(e) => setEntidad({ domicilio: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m184-municipio">Municipio</Label>
              <Input
                id="m184-municipio"
                value={ficha.entidad.municipio}
                onChange={(e) => setEntidad({ municipio: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m184-provincia">Provincia</Label>
              <Input
                id="m184-provincia"
                value={ficha.entidad.provincia}
                onChange={(e) => setEntidad({ provincia: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m184-cp">Código postal</Label>
              <Input
                id="m184-cp"
                value={ficha.entidad.codigoPostal}
                onChange={(e) => setEntidad({ codigoPostal: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ejercicio (vista)</Label>
              <Input value={String(ejercicio)} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Actividad principal (modelo 184)</Label>
              <Input
                readOnly
                className="bg-muted/50"
                value={`${MODELO184_ACTIVIDAD_PRINCIPAL} — Tenencia y administración de bienes inmuebles`}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium">Partícipes — NIF</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {ficha.participes.map((p) => (
                <div key={p.key} className="space-y-1.5">
                  <Label htmlFor={`m184-nif-${p.key}`}>{p.label}</Label>
                  <Input
                    id={`m184-nif-${p.key}`}
                    value={p.nif}
                    onChange={(e) => setParticipeNif(p.key, e.target.value)}
                    className="font-mono"
                    placeholder="12345678A"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m184-notas">Notas internas</Label>
            <textarea
              id="m184-notas"
              rows={2}
              value={ficha.entidad.notas}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEntidad({ notas: e.target.value })
              }
              placeholder="Contacto, apoderamiento, observaciones para la gestoría…"
              className="w-full min-h-[60px] rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Atribución de rentas por partícipe
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cálculo según participación en cada inmueble y movimientos del ejercicio {ejercicio}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partícipe</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead className="text-right">Ingresos atribuidos</TableHead>
                <TableHead className="text-right">Gastos atribuidos</TableHead>
                <TableHead className="text-right">Renta neta atribuida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumen.atribuciones.map((a) => (
                <TableRow key={a.key}>
                  <TableCell className="font-medium">{a.label}</TableCell>
                  <TableCell className="font-mono text-sm">{a.nif || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEuro(a.ingresosAtribuidos)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEuro(a.gastosAtribuidos)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatEuro(a.netoAtribuido)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-medium">
                <TableCell colSpan={2}>Total entidad</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEuro(resumen.totales.ingresos)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEuro(resumen.totales.gastos)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEuro(resumen.totales.neto)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Inmuebles y rendimientos del capital inmobiliario (clave C)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {resumen.totales.inmueblesCount} inmueble
            {resumen.totales.inmueblesCount === 1 ? "" : "s"} con movimientos en {ejercicio}
            {resumen.inmueblesMarcadosCount > resumen.totales.inmueblesCount
              ? ` (${resumen.inmueblesMarcadosCount} marcados en total)`
              : ""}
            · situación según origen/dirección/catastro
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {resumen.inmueblesExcluidos.length > 0 && (
            <div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground print:break-inside-avoid">
              <p className="font-medium text-foreground">No incluidos en {ejercicio}</p>
              <p className="mt-1">
                Sin ingresos ni gastos vinculados este ejercicio (no informan en el 184):{" "}
                {resumen.inmueblesExcluidos.map((i) => i.nombre).join(", ")}.
              </p>
              <ul className="mt-2 flex flex-wrap gap-2 print:hidden">
                {resumen.inmueblesExcluidos.map((i) => (
                  <li key={i.activoId}>
                    <a
                      href={`${activoDetalleBase}/${i.activoId}?year=${ejercicio}`}
                      className="text-primary underline"
                    >
                      {i.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resumen.inmuebles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {resumen.inmueblesMarcadosCount === 0 ? (
                <>
                  Marca activos como inmueble en{" "}
                  <a href="/sanyus/activos?cat=inmuebles" className="underline">
                    Activos
                  </a>
                  .
                </>
              ) : (
                <>
                  Hay inmuebles en cartera, pero ninguno con ingresos o gastos en {ejercicio}. Vincula
                  movimientos al activo o cambia de ejercicio.
                </>
              )}
            </p>
          ) : (
            resumen.inmuebles.map((inm) => (
              <div
                key={inm.activoId}
                className="space-y-4 rounded-lg border p-4 print:break-inside-avoid"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{inm.nombre}</h3>
                    <p className="text-xs text-muted-foreground">
                      Situación inmueble: {inm.situacion.codigo} — {inm.situacion.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 print:hidden">
                    {!inm.participacionOk && (
                      <Badge variant="destructive">Participación ≠ 100%</Badge>
                    )}
                    <a
                      href={`${activoDetalleBase}/${inm.activoId}?year=${ejercicio}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Editar activo
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {INMUEBLE_FIELD_GROUPS.flatMap((g) => g.slugs).map((slug) => (
                    <Field
                      key={slug}
                      label={campoLabel(slug)}
                      value={inm.campos[slug]}
                    />
                  ))}
                  <Field label="Precio compra (activo)" value={formatEuro(inm.precioCompra ?? 0)} />
                  <Field
                    label="Valor estimado"
                    value={
                      inm.valorEstimado != null ? formatEuro(inm.valorEstimado) : undefined
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Ingresos {ejercicio}</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatEuro(inm.ingresosAnuales)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Gastos {ejercicio}</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatEuro(inm.gastosAnuales)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Resultado neto</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatEuro(inm.resultadoNeto)}
                    </p>
                  </div>
                </div>

                {(inm.detalleIngresos.length > 0 || inm.detalleGastos.length > 0) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {inm.detalleIngresos.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Ingresos vinculados
                        </p>
                        <ul className="space-y-1 text-sm">
                          {inm.detalleIngresos.map((d) => (
                            <li key={d.concepto} className="flex justify-between gap-2">
                              <span className="truncate">{d.concepto}</span>
                              <span className="tabular-nums">{formatEuro(d.importe)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {inm.detalleGastos.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Gastos vinculados
                        </p>
                        <ul className="space-y-1 text-sm">
                          {inm.detalleGastos.map((d) => (
                            <li key={d.concepto} className="flex justify-between gap-2">
                              <span className="truncate">{d.concepto}</span>
                              <span className="tabular-nums">{formatEuro(d.importe)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Participación:{" "}
                  {resumen.participes.map((p) => (
                    <span key={p.key} className="mr-3">
                      {p.label}{" "}
                      {formatParticipacionPct(
                        parseParticipacionValor(inm.campos[p.slug] ?? "")
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-base">Referencia AEAT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            El modelo 184 comunica las rentas de la entidad en atribución de rentas y su reparto
            entre partícipes. Los rendimientos de capital inmobiliario (clave C) requieren la
            situación del inmueble y la referencia catastral.
          </p>
          <ul className="list-inside list-disc space-y-1">
            {SITUACION_INMUEBLE_OPTIONS.map((o) => (
              <li key={o.codigo}>
                <strong>{o.codigo}</strong> — {o.label}
              </li>
            ))}
          </ul>
          <p>
            <a
              href="https://www.agenciatributaria.gob.es/AEAT.internet/Inicio/La_Agencia_Tributaria/Todas_las_noticias/Noticias/Declaraciones_Informativas/Modelos_181_al_189/Modelo_184.shtml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline print:no-underline"
            >
              Información oficial — Modelo 184 (AEAT)
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
