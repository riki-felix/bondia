import { useState, useCallback, useEffect } from "react";
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
import { ESTADO_OPTIONS, OCUPADO_OPTIONS } from "@/lib/propertyTypes";
import { ImagePlus, Loader2 } from "lucide-react";

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  /** When set, dialog opens in edit mode and loads full property data */
  editId?: string | null;
}

const EMPTY_FORM = {
  titulo: "",
  direccion: "",
  precio_venta: "",
  precio_compra: "",
  superficie_m2: "",
  anio_construccion: "",
  estado: "sin_estado",
  ocupado: "false",
  numero_catastro: "",
  fecha_ingreso: "",
  fecha_compra: "",
  fecha_venta: "",
};

export function PropertyDialog({
  open,
  onOpenChange,
  onSaved,
  editId,
}: PropertyDialogProps) {
  const isEdit = !!editId;
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Load property data when editing
  useEffect(() => {
    if (!open || !editId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("propiedades")
        .select(
          "titulo, direccion, precio_compra, precio_venta, superficie_m2, anio_construccion, estado, ocupado, numero_catastro, fecha_ingreso, fecha_compra, fecha_venta, foto_destacada_path"
        )
        .eq("id", editId)
        .single();

      if (cancelled) return;
      setLoading(false);

      if (error || !data) {
        toast.error("No se pudo cargar la propiedad");
        return;
      }

      setForm({
        titulo: data.titulo || "",
        direccion: data.direccion || "",
        precio_compra: data.precio_compra != null ? String(data.precio_compra) : "",
        precio_venta: data.precio_venta != null ? String(data.precio_venta) : "",
        superficie_m2: data.superficie_m2 != null ? String(data.superficie_m2) : "",
        anio_construccion: data.anio_construccion != null ? String(data.anio_construccion) : "",
        estado: data.estado || "sin_estado",
        ocupado: data.ocupado ? "true" : "false",
        numero_catastro: data.numero_catastro || "",
        fecha_ingreso: data.fecha_ingreso ? String(data.fecha_ingreso).substring(0, 10) : "",
        fecha_compra: data.fecha_compra ? String(data.fecha_compra).substring(0, 10) : "",
        fecha_venta: data.fecha_venta ? String(data.fecha_venta).substring(0, 10) : "",
      });

      // Show existing image preview if available
      if (data.foto_destacada_path) {
        const { data: urlData } = supabase.storage
          .from("propiedades-images")
          .getPublicUrl(data.foto_destacada_path);
        if (urlData?.publicUrl) setImagePreview(urlData.publicUrl);
      }
    })();

    return () => { cancelled = true; };
  }, [open, editId]);

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
        // 1. Upload image if a new file was selected
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

        // 2. Build payload
        const payload: Record<string, unknown> = {
          titulo: form.titulo.trim(),
          estado: form.estado,
          ocupado: form.ocupado === "true",
          direccion: form.direccion.trim() || null,
          precio_venta: form.precio_venta || null,
          precio_compra: form.precio_compra || null,
          superficie_m2: form.superficie_m2 || null,
          anio_construccion: form.anio_construccion || null,
          numero_catastro: form.numero_catastro.trim() || null,
          fecha_ingreso: form.fecha_ingreso || null,
          fecha_compra: form.fecha_compra || null,
          fecha_venta: form.fecha_venta || null,
        };

        if (foto_destacada_path) payload.foto_destacada_path = foto_destacada_path;

        let url: string;
        if (isEdit) {
          // Update existing
          payload.id = editId;
          url = "/.netlify/functions/updateProperty";
        } else {
          // Create new
          payload.tipo = "inversion";
          url = "/.netlify/functions/createProperty";
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al guardar");

        toast.success(isEdit ? "Propiedad actualizada" : "Propiedad creada");
        resetForm();
        onOpenChange(false);
        onSaved();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al guardar propiedad";
        toast.error(message);
      } finally {
        setSaving(false);
      }
    },
    [form, imageFile, onOpenChange, onSaved, resetForm, isEdit, editId]
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
          <DialogTitle>
            {isEdit ? "Editar propiedad" : "Nueva propiedad"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos de la inversión"
              : "Rellena los datos de la nueva inversión"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
                  <Label htmlFor="titulo">Nombre *</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    onChange={set("titulo")}
                    placeholder="Nombre de la propiedad"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={form.direccion}
                    onChange={set("direccion")}
                    placeholder="Calle, número, ciudad"
                  />
                </div>
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
                  <Label htmlFor="precio_compra">Precio compra (€)</Label>
                  <Input
                    id="precio_compra"
                    type="number"
                    step="0.01"
                    value={form.precio_compra}
                    onChange={set("precio_compra")}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="precio_venta">Precio venta (€)</Label>
                  <Input
                    id="precio_venta"
                    type="number"
                    step="0.01"
                    value={form.precio_venta}
                    onChange={set("precio_venta")}
                    placeholder="0.00"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="superficie_m2">Superficie (m²)</Label>
                  <Input
                    id="superficie_m2"
                    type="number"
                    value={form.superficie_m2}
                    onChange={set("superficie_m2")}
                    placeholder="m²"
                  />
                </div>
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <Label htmlFor="numero_catastro">Ref. Catastral</Label>
                  <Input
                    id="numero_catastro"
                    value={form.numero_catastro}
                    onChange={set("numero_catastro")}
                    placeholder="Referencia"
                  />
                </div>
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
                {isEdit ? "Guardar cambios" : "Crear propiedad"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
