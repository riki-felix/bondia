// src/components/bloque/BloqueActivoDetail.tsx
import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatEuro } from "@/lib/moneyCalc";
import { type BloqueActivo, type BloqueCategoria, type ActivoTag, type ActivoCaracteristica, type ActivoCaracteristicaValor } from "@/lib/bloqueTypes";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import { ArrowLeft, Save, Loader2, Upload, Trash2, ImageIcon, X, Tag } from "lucide-react";

// ─── Props ───────────────────────────────────────────────────

interface BloqueActivoDetailProps {
  config: BloqueConfig;
  activo?: BloqueActivo | null;
  categorias: BloqueCategoria[];
  allTags?: ActivoTag[];
  allCaracteristicas?: ActivoCaracteristica[];
}

// ─── Component ───────────────────────────────────────────────

export default function BloqueActivoDetail({
  config,
  activo,
  categorias,
  allTags = [],
  allCaracteristicas = [],
}: BloqueActivoDetailProps) {
  const isNew = !activo;

  const [form, setForm] = useState({
    nombre: activo?.nombre ?? "",
    categoria_id: activo?.categoria_id ?? "",
    fecha_compra: activo?.fecha_compra ?? "",
    precio_compra: activo?.precio_compra != null ? String(activo.precio_compra) : "",
    valor_estimado: activo?.valor_estimado != null ? String(activo.valor_estimado) : "",
    notas: activo?.notas ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(activo?.foto_url ?? null);
  const [fechaEstimacion, setFechaEstimacion] = useState<string | null>(activo?.fecha_estimacion ?? null);
  const [uploading, setUploading] = useState(false);
  const [pendingFoto, setPendingFoto] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    () => (activo?.tags ?? []).map((t) => t.id)
  );

  // Characteristic values: map of caracteristica_id → valor
  const [caracValores, setCaracValores] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const v of activo?.caracteristica_valores ?? []) {
      map[v.caracteristica_id] = v.valor;
    }
    return map;
  });

  // Filter characteristics: show those that match the selected category or have no category
  const filteredCaracteristicas = useMemo(() => {
    return allCaracteristicas.filter(
      (c) => !c.categoria_id || c.categoria_id === form.categoria_id
    );
  }, [allCaracteristicas, form.categoria_id]);

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const dirty = useMemo(() => {
    if (isNew) return form.nombre.trim().length > 0;
    const origValores: Record<string, string> = {};
    for (const v of activo?.caracteristica_valores ?? []) {
      origValores[v.caracteristica_id] = v.valor;
    }
    const caracChanged = filteredCaracteristicas.some(
      (c) => (caracValores[c.id] ?? "") !== (origValores[c.id] ?? "")
    );
    return (
      form.nombre !== (activo?.nombre ?? "") ||
      form.categoria_id !== (activo?.categoria_id ?? "") ||
      form.fecha_compra !== (activo?.fecha_compra ?? "") ||
      form.precio_compra !== (activo?.precio_compra != null ? String(activo.precio_compra) : "") ||
      form.valor_estimado !== (activo?.valor_estimado != null ? String(activo.valor_estimado) : "") ||
      form.notas !== (activo?.notas ?? "") ||
      JSON.stringify(selectedTagIds.slice().sort()) !== JSON.stringify((activo?.tags ?? []).map(t => t.id).sort()) ||
      caracChanged
    );
  }, [form, activo, isNew, selectedTagIds, caracValores, filteredCaracteristicas]);

  const handleSave = useCallback(async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        categoria_id: form.categoria_id || null,
        fecha_compra: form.fecha_compra || null,
        precio_compra: form.precio_compra ? Number(form.precio_compra) : null,
        valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
        notas: form.notas,
      };

      if (!isNew) payload.id = activo!.id;

      const endpoint = isNew ? config.endpoints.createActivo : config.endpoints.updateActivo;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(isNew ? "Activo creado" : "Activo guardado");

      if (!isNew && data.fecha_estimacion) {
        setFechaEstimacion(data.fecha_estimacion);
      }

      // Sync tags
      const activoId = isNew ? data.id : activo!.id;
      if (selectedTagIds.length > 0 || !isNew) {
        try {
          await fetch(config.endpoints.syncActivoTags, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activo_id: activoId, tag_ids: selectedTagIds }),
          });
        } catch {
          // Non-blocking
        }
      }

      // Sync characteristic values
      const valores = filteredCaracteristicas
        .map((c) => ({ caracteristica_id: c.id, valor: caracValores[c.id] ?? "" }))
        .filter((v) => v.valor.trim());
      if (valores.length > 0 || !isNew) {
        try {
          await fetch(config.endpoints.syncCaracteristicaValores, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activo_id: activoId, valores }),
          });
        } catch {
          // Non-blocking
        }
      }

      if (isNew) {
        // Upload pending photo if selected
        if (pendingFoto) {
          try {
            await fetch(config.endpoints.uploadActivoFoto, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: data.id, base64: pendingFoto.base64, mimeType: pendingFoto.mimeType }),
            });
          } catch {
            // Non-blocking — photo upload failure doesn't prevent redirect
          }
        }
        // Redirect to detail page of the new activo
        window.location.href = `${config.routes.activoDetalle}/${data.id}`;
      }
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [form, isNew, activo, config, selectedTagIds, pendingFoto, filteredCaracteristicas, caracValores]);

  const handleUploadFoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (isNew) {
      // Store locally for upload after creation
      setPendingFoto({ base64, mimeType: file.type, preview: dataUrl });
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const res = await fetch(config.endpoints.uploadActivoFoto, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activo!.id, base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFotoUrl(data.foto_url);
      toast.success("Foto subida");
    } catch (err: any) {
      toast.error(err.message || "Error al subir foto");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [isNew, activo, config]);

  const handleDeleteFoto = useCallback(async () => {
    if (!activo) return;
    setUploading(true);
    try {
      const res = await fetch(config.endpoints.deleteActivoFoto, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activo.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFotoUrl(null);
      toast.success("Foto eliminada");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar foto");
    } finally {
      setUploading(false);
    }
  }, [activo, config]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href={config.routes.activos}>
            <ArrowLeft className="h-5 w-5" />
          </a>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-muted-foreground font-normal">{config.label} ·</span>{" "}
            {isNew ? "Nuevo activo" : form.nombre || "Activo"}
          </h1>
          {!isNew && activo?.categoria_nombre && (
            <p className="text-sm text-muted-foreground">{activo.categoria_nombre}</p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isNew ? "Crear" : "Guardar"}
        </Button>
      </div>

      <Separator />

      {/* ── Form ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: main fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del activo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={set("nombre")}
                placeholder="Nombre del activo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={form.categoria_id || "__none__"}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    categoria_id: v === "__none__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity border"
                        style={{
                          backgroundColor: selected ? tag.color + "20" : "transparent",
                          borderColor: selected ? tag.color : "hsl(var(--border))",
                          color: selected ? tag.color : "hsl(var(--muted-foreground))",
                        }}
                        onClick={() =>
                          setSelectedTagIds((prev) =>
                            selected
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id]
                          )
                        }
                      >
                        {selected && <X className="h-3 w-3" />}
                        {tag.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_compra">Fecha de compra</Label>
                <Input
                  id="fecha_compra"
                  type="date"
                  value={form.fecha_compra}
                  onChange={set("fecha_compra")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_compra">Precio de compra</Label>
                <Input
                  id="precio_compra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_compra}
                  onChange={set("precio_compra")}
                  placeholder="0,00 €"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_estimado">Valor estimado</Label>
                <Input
                  id="valor_estimado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor_estimado}
                  onChange={set("valor_estimado")}
                  placeholder="0,00 €"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de estimación</Label>
                <p className="text-sm text-muted-foreground pt-2">
                  {fechaEstimacion
                    ? new Date(fechaEstimacion + "T00:00:00").toLocaleDateString("es-ES")
                    : "Sin estimar"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column: foto + notas */}
        <div className="space-y-6">
          {/* Photo card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Foto principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(fotoUrl || pendingFoto) ? (
                <div className="relative group">
                  <img
                    src={pendingFoto?.preview ?? fotoUrl!}
                    alt={form.nombre}
                    className="w-full max-h-64 object-cover rounded-md border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={pendingFoto ? () => setPendingFoto(null) : handleDeleteFoto}
                    disabled={uploading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 rounded-md border border-dashed text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
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
                  {(fotoUrl || pendingFoto) ? "Cambiar foto" : "Subir foto"}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.notas}
                onChange={set("notas")}
                placeholder="Notas, observaciones, detalles adicionales..."
              />
            </CardContent>
          </Card>

          {/* Características */}
          {filteredCaracteristicas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Características</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredCaracteristicas.map((c) => (
                  <div key={c.id} className="space-y-1">
                    <Label htmlFor={`carac-${c.id}`} className="text-xs text-muted-foreground">
                      {c.nombre}
                    </Label>
                    <Input
                      id={`carac-${c.id}`}
                      value={caracValores[c.id] ?? ""}
                      onChange={(e) =>
                        setCaracValores((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      placeholder={c.nombre}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
