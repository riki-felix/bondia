import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { getSupabase } from "@/lib/supabaseReact";
import { PROPERTY_IMAGES_BUCKET } from "@/lib/propertyStorage";
import { ESTADO_OPTIONS, OCUPADO_OPTIONS } from "@/lib/propertyTypes";
import { moneyFieldToNumberOrNull } from "@/lib/moneyCalc";
import { ImagePlus, Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/propiedades/AddressAutocomplete";
import {
  applyCatastroToFormFields,
  CatastroReferenciaField,
  touchCatastroReferencia,
} from "@/components/propiedades/CatastroReferenciaField";

interface PropertyCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const EMPTY_FORM = {
  titulo: "",
  origen: "",
  direccion: "",
  precio_venta: "",
  precio_compra: "",
  superficie_m2: "",
  superficie_registrada_m2: "",
  superficie_real_m2: "",
  anio_construccion: "",
  estado: "borrador",
  ocupado: "false",
  numero_catastro: "",
  catastro_referencia_validada: "",
  catastro_validado_at: "",
  fecha_ingreso: "",
  fecha_compra: "",
  fecha_venta: "",
};

export function PropertyCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: PropertyCreateDialogProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
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

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.titulo.trim()) {
        toast.error("El nombre es obligatorio");
        return;
      }

      setSaving(true);

      try {
        // 1. Upload image if provided
        let foto_destacada_path: string | null = null;
        if (imageFile) {
          const supabase = getSupabase();
          const ext = imageFile.name.split(".").pop() || "jpg";
          const filePath = `propiedades/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from(PROPERTY_IMAGES_BUCKET)
            .upload(filePath, imageFile, { upsert: false });

          if (uploadError) {
            console.warn("Image upload failed:", uploadError.message);
            // Continue without image — not blocking
          } else {
            foto_destacada_path = filePath;
          }
        }

        // 2. Create property via Netlify function
        const payload: Record<string, unknown> = {
          titulo: form.titulo.trim(),
          tipo: "inversion",
          estado: form.estado,
          ocupado: form.ocupado === "true",
        };

        if (form.origen.trim()) payload.origen = form.origen.trim();
        if (form.direccion.trim()) payload.direccion = form.direccion.trim();
        const precioCompra = moneyFieldToNumberOrNull(form.precio_compra);
        const precioVenta = moneyFieldToNumberOrNull(form.precio_venta);
        if (precioVenta != null) payload.precio_venta = precioVenta;
        if (precioCompra != null) payload.precio_compra = precioCompra;
        if (form.superficie_m2) payload.superficie_m2 = form.superficie_m2;
        if (form.superficie_registrada_m2) {
          payload.superficie_registrada_m2 = form.superficie_registrada_m2;
        }
        if (form.superficie_real_m2) payload.superficie_real_m2 = form.superficie_real_m2;
        if (form.anio_construccion) payload.anio_construccion = form.anio_construccion;
        if (form.numero_catastro.trim())
          payload.numero_catastro = form.numero_catastro.trim();
        if (form.catastro_referencia_validada.trim()) {
          payload.catastro_referencia_validada = form.catastro_referencia_validada.trim();
        }
        if (form.catastro_validado_at) payload.catastro_validado_at = form.catastro_validado_at;
        if (form.fecha_ingreso) payload.fecha_ingreso = form.fecha_ingreso;
        if (form.fecha_compra) payload.fecha_compra = form.fecha_compra;
        if (form.fecha_venta) payload.fecha_venta = form.fecha_venta;
        if (foto_destacada_path) payload.foto_destacada_path = foto_destacada_path;

        const res = await fetch("/.netlify/functions/createProperty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear");

        toast.success("Propiedad creada");
        resetForm();
        onOpenChange(false);
        onCreated();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al crear propiedad";
        toast.error(message);
      } finally {
        setSaving(false);
      }
    },
    [form, imageFile, onOpenChange, onCreated, resetForm]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva propiedad</DialogTitle>
          <DialogDescription>
            Rellena los datos de la nueva inversión
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Imagen ── */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Imagen
            </Label>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
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
          </div>

          {/* ── Identificación ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Identificación
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="titulo">Nombre operativo *</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={set("titulo")}
                  placeholder="Ej. FONT 16 3º 2ª L'H"
                  required
                />
              </div>
              <div className="space-y-1.5">
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
          </div>

          <Separator />

          {/* ── Económicos ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Datos económicos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="precio_compra">Precio compra</Label>
                <MoneyInput
                  id="precio_compra"
                  value={form.precio_compra}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, precio_compra: v }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="precio_venta">Precio venta</Label>
                <MoneyInput
                  id="precio_venta"
                  value={form.precio_venta}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, precio_venta: v }))}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Características ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Características
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="superficie_m2">Superficie construida</Label>
                <Input
                  id="superficie_m2"
                  type="number"
                  value={form.superficie_m2}
                  onChange={set("superficie_m2")}
                  placeholder="m²"
                />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="superficie_registrada_m2">Superficie vivienda</Label>
                <Input
                  id="superficie_registrada_m2"
                  type="number"
                  value={form.superficie_registrada_m2}
                  onChange={set("superficie_registrada_m2")}
                  placeholder="m²"
                />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="superficie_real_m2">Superficie real en m²</Label>
                <Input
                  id="superficie_real_m2"
                  type="number"
                  value={form.superficie_real_m2}
                  onChange={set("superficie_real_m2")}
                  placeholder="m²"
                />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="anio_construccion">Año construcción</Label>
                <Input
                  id="anio_construccion"
                  type="number"
                  min="1800"
                  max="2100"
                  value={form.anio_construccion}
                  onChange={set("anio_construccion")}
                  placeholder="Año"
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
                onFachadaImported={({ file, previewUrl }) => {
                  setImageFile(file);
                  setImagePreview(previewUrl);
                }}
              />
            </div>
          </div>

          <Separator />

          {/* ── Estado ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Estado
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, estado: v }))
                  }
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
              <div className="space-y-1.5">
                <Label>Ocupado</Label>
                <Select
                  value={form.ocupado}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, ocupado: v }))
                  }
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
            </div>
          </div>

          <Separator />

          {/* ── Fechas ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Fechas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fecha_ingreso">Inicio operación</Label>
                <Input
                  id="fecha_ingreso"
                  type="date"
                  value={form.fecha_ingreso}
                  onChange={set("fecha_ingreso")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha_compra">Fecha compra</Label>
                <Input
                  id="fecha_compra"
                  type="date"
                  value={form.fecha_compra}
                  onChange={set("fecha_compra")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha_venta">Fecha venta</Label>
                <Input
                  id="fecha_venta"
                  type="date"
                  value={form.fecha_venta}
                  onChange={set("fecha_venta")}
                />
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear propiedad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
