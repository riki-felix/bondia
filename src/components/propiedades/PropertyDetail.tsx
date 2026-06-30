import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { uploadPropertyFeaturedImage } from "@/lib/propertyImageUpload";
import { ESTADO_OPTIONS, OCUPADO_OPTIONS, derivePagoFromIngreso } from "@/lib/propertyTypes";
import { INMUEBLE_ESTADO_VENDIDO } from "@/lib/sanyusInmueblePlantilla";
import { formatDateShort } from "@/lib/date";
import { formatEuro, moneyFieldFromNumber, moneyFieldToNumberOrNull } from "@/lib/moneyCalc";
import { deriveBrutoFromRetribucion } from "@/lib/settlementDerivations";
import { PropertyParticipacionSection } from "@/components/inversiones/PropertyParticipacionSection";
import {
  DEFAULT_PARTICIPACION_BIENES_SANYUS_CB,
  DEFAULT_PARTICIPACION_JASP,
  DEFAULT_PARTICIPACION_SANYUS,
  participacionBienesSanyusCbFormValue,
  parseParticipacionInput,
  validateBienesSanyusCb,
  validateParticipacionPair,
} from "@/lib/participacion";
import { AddressAutocomplete } from "@/components/propiedades/AddressAutocomplete";
import {
  applyCatastroToFormFields,
  CatastroReferenciaField,
  touchCatastroReferencia,
} from "@/components/propiedades/CatastroReferenciaField";
import { EntityDocumentsPanel } from "@/components/documents/EntityDocumentsPanel";
import { MasterLiquidacionDocumentsPanel } from "@/components/documents/MasterLiquidacionDocumentsPanel";
import { MASTER_LIQUIDACION_FOLDER_SLUG } from "@/lib/documentTypes";
import { ArrowLeft, Calendar, Clock, ImageIcon, Loader2, Save, Trash2, Upload } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface PropertyData {
  id: string;
  titulo: string | null;
  origen: string | null;
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
  superficie_registrada_m2: number | null;
  superficie_real_m2: number | null;
  anio_construccion: number | null;
  numero_catastro: string | null;
  catastro_referencia_validada: string | null;
  catastro_validado_at: string | null;
  fecha_ingreso: string | null;
  fecha_compra: string | null;
  fecha_venta: string | null;
  // Investment data
  numero_operacion: number | null;
  pago: boolean;
  participacion_sanyus: number | null;
  participacion_jasp: number | null;
  participacion_bienes_sanyus_cb: number | null;
  aportacion: number | null;
  retribucion: number | null;
  retencion: number | null;
  ingreso_banco: number | null;
  efectivo: number | null;
  jasp_10_percent: number | null;
  notas: string | null;
  beneficio_bruto: number | null;
  fecha_liquidacion: string | null;
  fecha_aportacion: string | null;
  fecha_transferencia: string | null;
  numero_op_liquidacion: number | null;
  liquidada_at: string | null;
}

interface PropertyDetailProps {
  property?: PropertyData | null;
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
  imageUrl: initialImageUrl = null,
}: PropertyDetailProps) {
  const isCreate = !property;
  const [form, setForm] = useState({
    titulo: property?.titulo ?? "",
    origen: property?.origen ?? "",
    direccion: property?.direccion ?? "",
    estado: property?.estado ?? "borrador",
    ocupado: property?.ocupado ? "true" : "false",
    precio_compra: moneyFieldFromNumber(property?.precio_compra),
    precio_venta: moneyFieldFromNumber(property?.precio_venta),
    superficie_m2: property?.superficie_m2 != null ? String(property.superficie_m2) : "",
    superficie_registrada_m2:
      property?.superficie_registrada_m2 != null
        ? String(property.superficie_registrada_m2)
        : "",
    superficie_real_m2:
      property?.superficie_real_m2 != null ? String(property.superficie_real_m2) : "",
    anio_construccion: property?.anio_construccion != null ? String(property.anio_construccion) : "",
    numero_catastro: property?.numero_catastro ?? "",
    catastro_referencia_validada: property?.catastro_referencia_validada ?? "",
    catastro_validado_at: property?.catastro_validado_at ?? "",
    fecha_ingreso: property?.fecha_ingreso ? String(property.fecha_ingreso).substring(0, 10) : "",
    fecha_compra: property?.fecha_compra ? String(property.fecha_compra).substring(0, 10) : "",
    fecha_venta: property?.fecha_venta ? String(property.fecha_venta).substring(0, 10) : "",
    notas: property?.notas ?? "",
    participacion_sanyus:
      property?.participacion_sanyus != null
        ? String(property.participacion_sanyus)
        : "",
    participacion_jasp:
      property?.participacion_jasp != null
        ? String(property.participacion_jasp)
        : "",
    participacion_bienes_sanyus_cb: participacionBienesSanyusCbFormValue(
      property?.participacion_bienes_sanyus_cb
    ),
  });
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [pendingFoto, setPendingFoto] = useState<{
    base64: string;
    mimeType: string;
    preview: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleUploadFoto = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede superar 5 MB");
        return;
      }

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1];

      if (isCreate) {
        setPendingFoto({ base64, mimeType: file.type, preview: dataUrl });
        setImagePreview(dataUrl);
        e.target.value = "";
        return;
      }

      setUploading(true);
      try {
        const { publicUrl } = await uploadPropertyFeaturedImage(property!.id, file);
        setImagePreview(publicUrl);
        setPendingFoto(null);
        toast.success("Foto subida");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error al subir foto");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [isCreate, property]
  );

  const handleDeleteFoto = useCallback(async () => {
    if (isCreate || pendingFoto) {
      setPendingFoto(null);
      setImagePreview(null);
      return;
    }
    if (!property) return;

    setUploading(true);
    try {
      const res = await fetch("/.netlify/functions/updateProperty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: property.id, foto_destacada_path: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar foto");
      setImagePreview(null);
      toast.success("Foto eliminada");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar foto");
    } finally {
      setUploading(false);
    }
  }, [isCreate, pendingFoto, property]);

  const handleSave = useCallback(async () => {
    if (!form.titulo.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const pctS =
      parseParticipacionInput(form.participacion_sanyus) ??
      DEFAULT_PARTICIPACION_SANYUS;
    const pctJ =
      parseParticipacionInput(form.participacion_jasp) ??
      DEFAULT_PARTICIPACION_JASP;
    const participacionError = validateParticipacionPair(pctS, pctJ);
    if (participacionError) {
      toast.error(participacionError);
      return;
    }
    const bienesCb =
      parseParticipacionInput(form.participacion_bienes_sanyus_cb) ??
      DEFAULT_PARTICIPACION_BIENES_SANYUS_CB;
    const bienesError = validateBienesSanyusCb(bienesCb);
    if (bienesError) {
      toast.error(bienesError);
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        titulo: form.titulo.trim(),
        estado: form.estado || null,
        ocupado: form.ocupado === "true",
        origen: form.origen.trim() || null,
        direccion: form.direccion.trim() || null,
        precio_compra: moneyFieldToNumberOrNull(form.precio_compra),
        precio_venta: moneyFieldToNumberOrNull(form.precio_venta),
        superficie_m2: form.superficie_m2 || null,
        superficie_registrada_m2: form.superficie_registrada_m2 || null,
        superficie_real_m2: form.superficie_real_m2 || null,
        anio_construccion: form.anio_construccion || null,
        numero_catastro: form.numero_catastro.trim() || null,
        catastro_referencia_validada: form.catastro_referencia_validada.trim() || null,
        catastro_validado_at: form.catastro_validado_at || null,
        fecha_ingreso: form.fecha_ingreso || null,
        fecha_compra: form.fecha_compra || null,
        fecha_venta: form.fecha_venta || null,
        notas: form.notas.trim() || null,
        participacion_sanyus: pctS,
        participacion_jasp: pctJ,
        participacion_bienes_sanyus_cb: bienesCb,
      };

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

      const propertyId = isCreate ? (data.id as string) : property!.id;

      if (isCreate && pendingFoto) {
        try {
          await fetch("/.netlify/functions/uploadPropertyFoto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: propertyId,
              base64: pendingFoto.base64,
              mimeType: pendingFoto.mimeType,
            }),
          });
        } catch {
          // Non-blocking
        }
      }

      if (isCreate) {
        toast.success("Propiedad creada");
        window.location.href = `/propiedades/${propertyId}`;
        return;
      }
      toast.success("Propiedad actualizada");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [form, pendingFoto, property?.id, isCreate]);

  const isVendido = form.estado === INMUEBLE_ESTADO_VENDIDO;

  const daysActive = calcDaysActive(
    property?.created_at ?? null,
    property?.liquidacion ?? false,
    property?.fecha_transferencia ?? null
  );

  const displayTitle = isCreate
    ? "Nueva propiedad"
    : (form.titulo || property?.titulo || "Sin título");

  const fotoBlock = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Foto principal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {imagePreview || pendingFoto ? (
          <div className="relative group">
            <img
              src={pendingFoto?.preview ?? imagePreview!}
              alt={displayTitle}
              className="w-full max-h-40 object-cover rounded-md border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDeleteFoto}
              disabled={uploading}
              title="Eliminar foto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 rounded-md border border-dashed text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
        <div>
          <Label
            htmlFor="foto-upload"
            className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {imagePreview || pendingFoto ? "Cambiar foto" : "Subir foto"}
          </Label>
          <input
            id="foto-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadFoto}
            disabled={uploading}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        <Button variant="ghost" size="icon" asChild>
          <a href="/propiedades">
            <ArrowLeft className="h-5 w-5" />
          </a>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            <span className="text-muted-foreground font-normal">Engine ·</span>{" "}
            {displayTitle}
          </h1>
          {!isCreate && property && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant={estadoVariant(property.estado)}>
                  {estadoLabel(property.estado)}
                </Badge>
                <Badge variant={property.liquidacion ? "success" : "secondary"}>
                  {property.liquidacion ? "Liquidada" : "Activa"}
                </Badge>
                {property.numero_operacion != null && (
                  <Badge variant="outline">Nº {property.numero_operacion}</Badge>
                )}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateShort(property.created_at)}
                </span>
                {daysActive != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {daysActive} días
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-8 items-start">
        {/* ── Columna principal ── */}
        <div className="space-y-6 w-full max-w-xl mx-auto lg:max-w-none">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de la propiedad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Nombre operativo *</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={set("titulo")}
                  placeholder="Nombre operativo"
                />
                <p className="text-xs text-muted-foreground">
                  Formato interno (ej. FONT 16 3º 2ª L&apos;H). No se modifica al guardar la dirección postal.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fecha, precio y operación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_ingreso">Inicio operación</Label>
                  <Input
                    id="fecha_ingreso"
                    type="date"
                    value={form.fecha_ingreso}
                    onChange={set("fecha_ingreso")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_compra">Fecha de compra</Label>
                  <Input
                    id="fecha_compra"
                    type="date"
                    value={form.fecha_compra}
                    onChange={set("fecha_compra")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio_compra">Precio de compra</Label>
                  <MoneyInput
                    id="precio_compra"
                    value={form.precio_compra}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, precio_compra: v }))}
                    placeholder="0,00 €"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origen">Origen</Label>
                  <Input
                    id="origen"
                    value={form.origen}
                    onChange={set("origen")}
                    placeholder="Fuente u origen de la inversión"
                  />
                </div>
                <AddressAutocomplete
                  id="direccion"
                  value={form.direccion}
                  onChange={(v) => setForm((prev) => ({ ...prev, direccion: v }))}
                  className="sm:col-span-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Características</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="superficie_m2">Superficie construida</Label>
                  <Input
                    id="superficie_m2"
                    type="number"
                    value={form.superficie_m2}
                    onChange={set("superficie_m2")}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="superficie_registrada_m2">Superficie vivienda</Label>
                  <Input
                    id="superficie_registrada_m2"
                    type="number"
                    value={form.superficie_registrada_m2}
                    onChange={set("superficie_registrada_m2")}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="superficie_real_m2">Superficie real en m²</Label>
                  <Input
                    id="superficie_real_m2"
                    type="number"
                    value={form.superficie_real_m2}
                    onChange={set("superficie_real_m2")}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="anio_construccion">Año construcción</Label>
                  <Input
                    id="anio_construccion"
                    type="number"
                    min="1800"
                    max="2100"
                    value={form.anio_construccion}
                    onChange={set("anio_construccion")}
                  />
                </div>
                <CatastroReferenciaField
                  value={form.numero_catastro}
                  validatedReferencia={form.catastro_referencia_validada}
                  validatedAt={form.catastro_validado_at}
                  onChange={(v) => setForm((prev) => touchCatastroReferencia(prev, v))}
                  onValidated={(result) =>
                    setForm((prev) => applyCatastroToFormFields(prev, result))
                  }
                  propertyId={isCreate ? undefined : property?.id}
                  onFachadaImported={({ file, previewUrl }) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      const base64 = dataUrl.split(",")[1];
                      setPendingFoto({
                        base64,
                        mimeType: file.type || "image/jpeg",
                        preview: previewUrl,
                      });
                      setImagePreview(previewUrl);
                    };
                    reader.readAsDataURL(file);
                  }}
                  onFachadaUploaded={(publicUrl) => {
                    setImagePreview(publicUrl);
                    setPendingFoto(null);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={form.estado}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, estado: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADO_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isVendido && (
                    <div className="space-y-2">
                      <Label htmlFor="precio_venta">Precio de venta</Label>
                      <MoneyInput
                        id="precio_venta"
                        value={form.precio_venta}
                        onValueChange={(v) => setForm((prev) => ({ ...prev, precio_venta: v }))}
                        placeholder="0,00 €"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ocupado</Label>
                    <Select
                      value={form.ocupado}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, ocupado: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OCUPADO_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isVendido && (
                    <div className="space-y-2">
                      <Label htmlFor="fecha_venta">Fecha de venta</Label>
                      <Input
                        id="fecha_venta"
                        type="date"
                        value={form.fecha_venta}
                        onChange={set("fecha_venta")}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Participación</CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyParticipacionSection
                values={{
                  participacion_sanyus: form.participacion_sanyus,
                  participacion_jasp: form.participacion_jasp,
                  participacion_bienes_sanyus_cb: form.participacion_bienes_sanyus_cb,
                }}
                onChange={(field, value) =>
                  setForm((prev) => ({ ...prev, [field]: value }))
                }
              />
              <p className="text-xs text-muted-foreground mt-2">
                Retribución y JASP se calculan desde el bruto en Liquidaciones.
              </p>
            </CardContent>
          </Card>

          {!isCreate && property && (
            <>
              <MasterLiquidacionDocumentsPanel
                bloque="engine"
                entityType="propiedad"
                entityId={property.id}
              />
              <EntityDocumentsPanel
                bloque="engine"
                entityType="propiedad"
                entityId={property.id}
                excludeFolderSlug={MASTER_LIQUIDACION_FOLDER_SLUG}
              />
            </>
          )}
        </div>

        {/* ── Columna lateral ── */}
        <aside className="space-y-4 lg:sticky lg:top-6 w-full max-w-xl mx-auto lg:max-w-none">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isCreate ? "Crear propiedad" : "Guardar"}
              </Button>
            </CardContent>
          </Card>

          {fotoBlock}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.notas}
                onChange={set("notas")}
                placeholder="Notas, observaciones, detalles adicionales..."
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ── Datos Engine (solo lectura) ── */}
      {!isCreate && property && (
        <>
          <Separator className="max-w-4xl mx-auto" />
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
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
                    <span className="text-muted-foreground block text-xs uppercase">JASP</span>
                    <span className="font-medium tabular-nums">{formatEuro(property.jasp_10_percent)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase">Pago</span>
                    <span className="font-medium">
                      {derivePagoFromIngreso(property.ingreso_banco)
                        ? "Realizado"
                        : "Pendiente"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase">Ejercicio</span>
                    <span className="font-medium">{property.ejercicio ?? "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(property.liquidacion ||
              property.fecha_liquidacion ||
              property.numero_op_liquidacion) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Liquidación JASP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase">
                        Estado
                      </span>
                      <Badge
                        variant={property.liquidacion ? "success" : "outline"}
                        className="mt-1"
                      >
                        {property.liquidacion ? "Liquidada" : "Pendiente"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase">
                        Fecha liquidación
                      </span>
                      <span className="font-medium">
                        {formatDateShort(property.fecha_liquidacion)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase">
                        Nº OP (JASP)
                      </span>
                      <span className="font-medium tabular-nums">
                        {property.numero_op_liquidacion ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase">
                        Bruto
                      </span>
                      <span className="font-medium tabular-nums" data-money>
                        {formatEuro(
                          (property.beneficio_bruto ?? 0) > 0
                            ? property.beneficio_bruto!
                            : deriveBrutoFromRetribucion({
                                retribucion: property.retribucion ?? 0,
                                propiedad_participacion_sanyus:
                                  property.participacion_sanyus,
                              })
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase">
                        F. aportación
                      </span>
                      <span className="font-medium">
                        {formatDateShort(property.fecha_aportacion)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase">
                        F. transferencia
                      </span>
                      <span className="font-medium">
                        {formatDateShort(property.fecha_transferencia)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
