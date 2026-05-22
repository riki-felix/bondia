import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { getSupabase } from "@/lib/supabaseReact";
import { ESTADO_OPTIONS, OCUPADO_OPTIONS } from "@/lib/propertyTypes";
import { formatDateShort } from "@/lib/date";
import { formatEuro } from "@/lib/moneyCalc";
import { ArrowLeft, Building2, Calendar, Clock, ImagePlus, Loader2, Save } from "lucide-react";
import { EntityDocumentsPanel } from "@/components/documents/EntityDocumentsPanel";

// ─── Types ───────────────────────────────────────────────────

interface PropertyData {
  id: string;
  titulo: string | null;
  direccion: string | null;
  estado: string | null;
  ejercicio: number | null;
  created_at: string | null;
  liquidacion: boolean;
  ocupado: boolean;
  foto_destacada_path: string | null;
  precio_compra: number | null;
  precio_venta: number | null;
  superficie_m2: number | null;
  anio_construccion: number | null;
  numero_catastro: string | null;
  fecha_ingreso: string | null;
  fecha_compra: string | null;
  fecha_venta: string | null;
  // Investment data
  numero_operacion: number | null;
  pago: boolean;
  aportacion: number | null;
  retribucion: number | null;
  retencion: number | null;
  ingreso_banco: number | null;
  efectivo: number | null;
  jasp_10_percent: number | null;
  notas: string | null;
}

interface Settlement {
  id: string;
  numero_liquidacion: number;
  fecha_liquidacion: string;
  aportacion: number;
  retribucion: number;
  retencion: number;
  transferencia: number;
  efectivo: number;
  fecha_transferencia: string | null;
  liquidado: boolean;
  ejercicio: number | null;
}

interface PropertyDetailProps {
  property?: PropertyData | null;
  settlements?: Settlement[];
  imageUrl?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────

function estadoVariant(
  estado: string | null
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  switch (estado?.toLowerCase()) {
    case "borrador": return "outline";
    case "activa": return "default";
    case "vendido": return "success";
    case "comprado": return "default";
    case "alquiler": return "secondary";
    case "tanteo":
    case "negociacion": return "warning";
    case "reforma": return "outline";
    default: return "secondary";
  }
}

function estadoLabel(estado: string | null): string {
  return ESTADO_OPTIONS.find((o) => o.value === estado)?.label ?? estado ?? "—";
}

function calcDaysActive(
  createdAt: string | null,
  liquidacion: boolean,
  fechaTransferencia: string | null
): number | null {
  if (!createdAt) return null;
  const start = new Date(createdAt);
  if (isNaN(start.getTime())) return null;
  let end: Date;
  if (liquidacion && fechaTransferencia) {
    end = new Date(fechaTransferencia);
    if (isNaN(end.getTime())) end = new Date();
  } else {
    end = new Date();
  }
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

// ─── Component ───────────────────────────────────────────────

export default function PropertyDetail({
  property,
  settlements = [],
  imageUrl: initialImageUrl = null,
}: PropertyDetailProps) {
  const isCreate = !property;
  const [form, setForm] = useState({
    titulo: property?.titulo ?? "",
    direccion: property?.direccion ?? "",
    estado: property?.estado ?? "borrador",
    ocupado: property?.ocupado ? "true" : "false",
    precio_compra: property?.precio_compra != null ? String(property.precio_compra) : "",
    precio_venta: property?.precio_venta != null ? String(property.precio_venta) : "",
    superficie_m2: property?.superficie_m2 != null ? String(property.superficie_m2) : "",
    anio_construccion: property?.anio_construccion != null ? String(property.anio_construccion) : "",
    numero_catastro: property?.numero_catastro ?? "",
    fecha_ingreso: property?.fecha_ingreso ? String(property.fecha_ingreso).substring(0, 10) : "",
    fecha_compra: property?.fecha_compra ? String(property.fecha_compra).substring(0, 10) : "",
    fecha_venta: property?.fecha_venta ? String(property.fecha_venta).substring(0, 10) : "",
    notas: property?.notas ?? "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [saving, setSaving] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!form.titulo.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      let foto_destacada_path: string | null = null;
      if (imageFile) {
        const supabase = getSupabase();
        const ext = imageFile.name.split(".").pop() || "jpg";
        const filePath = `propiedades/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("propiedades-images")
          .upload(filePath, imageFile, { upsert: false });
        if (uploadError) {
          console.warn("Image upload failed:", uploadError.message);
        } else {
          foto_destacada_path = filePath;
        }
      }

      const payload: Record<string, unknown> = {
        titulo: form.titulo.trim(),
        estado: form.estado || null,
        ocupado: form.ocupado === "true",
        direccion: form.direccion.trim() || null,
        precio_compra: form.precio_compra || null,
        precio_venta: form.precio_venta || null,
        superficie_m2: form.superficie_m2 || null,
        anio_construccion: form.anio_construccion || null,
        numero_catastro: form.numero_catastro.trim() || null,
        fecha_ingreso: form.fecha_ingreso || null,
        fecha_compra: form.fecha_compra || null,
        fecha_venta: form.fecha_venta || null,
      };
      if (foto_destacada_path) payload.foto_destacada_path = foto_destacada_path;

      let url: string;
      if (isCreate) {
        payload.tipo = "inversion";
        url = "/.netlify/functions/createProperty";
      } else {
        payload.id = property!.id;
        url = "/.netlify/functions/updateProperty";
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      if (isCreate) {
        toast.success("Propiedad creada");
        window.location.href = `/propiedades/${data.id}`;
        return;
      }
      toast.success("Propiedad actualizada");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [form, imageFile, property?.id, isCreate]);

  const lastTransferDate = settlements.find(
    (s) => s.liquidado && s.fecha_transferencia
  )?.fecha_transferencia ?? null;

  const daysActive = calcDaysActive(
    property?.created_at ?? null,
    property?.liquidacion ?? false,
    lastTransferDate
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Back link ── */}
      <a
        href="/propiedades"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a propiedades
      </a>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        {/* Image */}
        <label className="shrink-0 w-full sm:w-64 aspect-[16/10] rounded-lg border-2 border-dashed overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-center bg-muted">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt={form.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <ImagePlus className="h-8 w-8 mb-1" />
              <span className="text-sm">Seleccionar imagen</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>

        {/* Summary */}
        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isCreate ? "Nueva propiedad" : (property?.titulo ?? "Sin título")}
          </h1>
          {!isCreate && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant={estadoVariant(property!.estado)}>
                  {estadoLabel(property!.estado)}
                </Badge>
                <Badge variant={property!.liquidacion ? "success" : "secondary"}>
                  {property!.liquidacion ? "Liquidada" : "Activa"}
                </Badge>
                {property!.numero_operacion != null && (
                  <Badge variant="outline">Nº {property!.numero_operacion}</Badge>
                )}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateShort(property!.created_at)}
                </span>
                {daysActive != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {daysActive} días
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Editable form ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="titulo">Nombre *</Label>
              <Input id="titulo" value={form.titulo} onChange={set("titulo")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" value={form.direccion} onChange={set("direccion")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos económicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="precio_compra">Precio compra (€)</Label>
              <Input id="precio_compra" type="number" step="0.01" value={form.precio_compra} onChange={set("precio_compra")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precio_venta">Precio venta (€)</Label>
              <Input id="precio_venta" type="number" step="0.01" value={form.precio_venta} onChange={set("precio_venta")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Características</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="superficie_m2">Superficie (m²)</Label>
              <Input id="superficie_m2" type="number" value={form.superficie_m2} onChange={set("superficie_m2")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anio_construccion">Año construcción</Label>
              <Input id="anio_construccion" type="number" min="1800" max="2100" value={form.anio_construccion} onChange={set("anio_construccion")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero_catastro">Ref. Catastral</Label>
              <Input id="numero_catastro" value={form.numero_catastro} onChange={set("numero_catastro")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm((prev) => ({ ...prev, estado: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ocupado</Label>
              <Select value={form.ocupado} onValueChange={(v) => setForm((prev) => ({ ...prev, ocupado: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OCUPADO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fechas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_ingreso">Inicio operación</Label>
              <Input id="fecha_ingreso" type="date" value={form.fecha_ingreso} onChange={set("fecha_ingreso")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_compra">Fecha compra</Label>
              <Input id="fecha_compra" type="date" value={form.fecha_compra} onChange={set("fecha_compra")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_venta">Fecha venta</Label>
              <Input id="fecha_venta" type="date" value={form.fecha_venta} onChange={set("fecha_venta")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Notas ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[80px] rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={form.notas}
            onChange={set("notas")}
            placeholder="Notas internas..."
          />
        </CardContent>
      </Card>

      {!isCreate && property && (
        <EntityDocumentsPanel
          bloque="engine"
          entityType="propiedad"
          entityId={property.id}
        />
      )}

      {/* ── Save button ── */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isCreate ? "Crear propiedad" : "Guardar cambios"}
        </Button>
      </div>

      {/* ── Investment data (read-only) ── */}
      {!isCreate && property && <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de inversión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase">Aportación</span>
              <span className="font-medium tabular-nums">{formatEuro(property.aportacion)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase">Retribución</span>
              <span className="font-medium tabular-nums">{formatEuro(property.retribucion)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase">Retención</span>
              <span className="font-medium tabular-nums">{formatEuro(property.retencion)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase">Ingreso banco</span>
              <span className="font-medium tabular-nums">{formatEuro(property.ingreso_banco)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase">Efectivo</span>
              <span className="font-medium tabular-nums">{formatEuro(property.efectivo)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase">JASP 20%</span>
              <span className="font-medium tabular-nums">{formatEuro(property.jasp_10_percent)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase">Pago</span>
              <span className="font-medium">{property.pago ? "Realizado" : "Pendiente"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase">Ejercicio</span>
              <span className="font-medium">{property.ejercicio ?? "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>}

      {/* ── Liquidaciones ── */}
      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Liquidaciones ({settlements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                    <th className="py-2 pr-4">Nº</th>
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4 text-right">Aportación</th>
                    <th className="py-2 pr-4 text-right">Retribución</th>
                    <th className="py-2 pr-4 text-right">Transferencia</th>
                    <th className="py-2 pr-4">F. Transferencia</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 tabular-nums">{s.numero_liquidacion}</td>
                      <td className="py-2 pr-4">{formatDateShort(s.fecha_liquidacion)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatEuro(s.aportacion)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatEuro(s.retribucion)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatEuro(s.transferencia)}</td>
                      <td className="py-2 pr-4">{formatDateShort(s.fecha_transferencia)}</td>
                      <td className="py-2">
                        <Badge variant={s.liquidado ? "success" : "outline"} className="text-xs">
                          {s.liquidado ? "Liquidada" : "Pendiente"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
