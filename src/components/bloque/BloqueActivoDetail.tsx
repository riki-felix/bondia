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
import { type BloqueActivo, type BloqueCategoria } from "@/lib/bloqueTypes";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

// ─── Props ───────────────────────────────────────────────────

interface BloqueActivoDetailProps {
  config: BloqueConfig;
  activo?: BloqueActivo | null;
  categorias: BloqueCategoria[];
}

// ─── Component ───────────────────────────────────────────────

export default function BloqueActivoDetail({
  config,
  activo,
  categorias,
}: BloqueActivoDetailProps) {
  const isNew = !activo;

  const [form, setForm] = useState({
    nombre: activo?.nombre ?? "",
    categoria_id: activo?.categoria_id ?? "",
    fecha_compra: activo?.fecha_compra ?? "",
    precio_compra: activo?.precio_compra != null ? String(activo.precio_compra) : "",
    notas: activo?.notas ?? "",
  });

  const [saving, setSaving] = useState(false);

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const dirty = useMemo(() => {
    if (isNew) return form.nombre.trim().length > 0;
    return (
      form.nombre !== (activo?.nombre ?? "") ||
      form.categoria_id !== (activo?.categoria_id ?? "") ||
      form.fecha_compra !== (activo?.fecha_compra ?? "") ||
      form.precio_compra !== (activo?.precio_compra != null ? String(activo.precio_compra) : "") ||
      form.notas !== (activo?.notas ?? "")
    );
  }, [form, activo, isNew]);

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

      if (isNew) {
        // Redirect to detail page of the new activo
        window.location.href = `${config.routes.activoDetalle}/${data.id}`;
      }
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [form, isNew, activo, config]);

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
          </CardContent>
        </Card>

        {/* Right column: notas */}
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
      </div>
    </div>
  );
}
