import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

type FeatureItem = {
  id: string;
  titulo: string;
  descripcion: string;
  progreso: number;
  created_at: string;
  updated_at: string;
};

interface FeatureProgressPanelProps {
  initialData: FeatureItem[];
}

type FormState = {
  titulo: string;
  descripcion: string;
  progreso: number;
};

const EMPTY_FORM: FormState = {
  titulo: "",
  descripcion: "",
  progreso: 0,
};

function clamp(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function StatusIcon({ progress }: { progress: number }) {
  const safe = clamp(progress);

  if (safe >= 100) {
    return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />;
  }

  if (safe > 0) {
    const size = 20;
    const stroke = 2.5;
    const center = size / 2;
    const radius = (size - stroke) / 2;
    // Keep a minimum visible arc so "iniciado" states are clearly visible.
    const visiblePct = Math.min(100, Math.max(8, safe));

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        aria-label={`Progreso ${safe}%`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="text-muted-foreground"
          stroke="currentColor"
          opacity={0.35}
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${visiblePct} 100`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
    );
  }

  return <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/70" />;
}

export default function FeatureProgressPanel({ initialData }: FeatureProgressPanelProps) {
  const [items, setItems] = useState<FeatureItem[]>(initialData);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    [items]
  );

  const pendingCount = useMemo(
    () => items.filter((item) => clamp(item.progreso) < 100).length,
    [items]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (item: FeatureItem) => {
    setEditingId(item.id);
    setForm({
      titulo: item.titulo,
      descripcion: item.descripcion,
      progreso: clamp(item.progreso),
    });
    setOpen(true);
  };

  const saveFeature = async () => {
    const titulo = form.titulo.trim();
    if (!titulo) return;

    try {
      if (editingId) {
        const res = await fetch("/.netlify/functions/updateFeatureTask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            titulo,
            descripcion: form.descripcion.trim(),
            progreso: clamp(form.progreso),
          }),
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data.error || "Error al guardar");

        setItems((prev) => prev.map((item) => (item.id === editingId ? data : item)));
        toast.success("Tarea actualizada");
      } else {
        const res = await fetch("/.netlify/functions/createFeatureTask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo,
            descripcion: form.descripcion.trim(),
            progreso: clamp(form.progreso),
          }),
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data.error || "Error al crear");

        setItems((prev) => [data, ...prev]);
        toast.success("Tarea creada");
      }

      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      toast.error(e.message || "Error guardando tarea");
    }
  };

  const deleteFeature = async () => {
    if (!editingId) return;

    try {
      const res = await fetch("/.netlify/functions/deleteFeatureTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId }),
      });

      if (!res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        throw new Error(data.error || "Error al eliminar");
      }

      setItems((prev) => prev.filter((item) => item.id !== editingId));
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      toast.success("Tarea eliminada");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar tarea");
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm lg:sticky lg:top-6">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
              Tareas pendientes
            </CardTitle>
          </div>
          <div className="inline-flex items-center rounded-xl border bg-muted px-3 py-1 text-sm font-semibold text-foreground">
            {pendingCount}/{items.length}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={openCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Añadir
          </Button>
        </div>

        {sortedItems.length === 0 ? (
          <div className="rounded-2xl border bg-background p-4 text-center text-sm text-muted-foreground">
            Sin funcionalidades todavía. Pulsa "Añadir" para crear la primera.
          </div>
        ) : (
          <div className="rounded-2xl border bg-background p-4">
            <div className="space-y-2">
              {sortedItems.map((item) => {
                const done = clamp(item.progreso) >= 100;
                const pct = clamp(item.progreso);

                return (
                  <div key={item.id} className="rounded-xl px-1 py-1">
                    <div className="flex items-start gap-3">
                      <StatusIcon progress={item.progreso} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <button
                            type="button"
                            className={`truncate text-left text-md leading-tight ${
                              done
                                ? "text-muted-foreground line-through decoration-2"
                                : "font-semibold text-foreground hover:underline"
                            }`}
                            onClick={() => openEdit(item)}
                            title="Editar funcionalidad"
                          >
                            {item.titulo}
                          </button>
                          <span className="text-sm font-medium text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-xs ${
                            done
                              ? "text-muted-foreground line-through decoration-2"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.descripcion || "Sin descripción"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setEditingId(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar funcionalidad" : "Nueva funcionalidad"}
            </DialogTitle>
            <DialogDescription>
              Añade título, descripción y porcentaje de progreso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="feature-title">
                Título
              </label>
              <Input
                id="feature-title"
                value={form.titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ej. Automatizar facturas"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="feature-description">
                Descripción
              </label>
              <textarea
                id="feature-description"
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                value={form.descripcion}
                onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Notas rápidas de la funcionalidad"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Estado</label>
                <span className="text-xs text-muted-foreground">{clamp(form.progreso)}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[clamp(form.progreso)]}
                onValueChange={(values) =>
                  setForm((prev) => ({ ...prev, progreso: values[0] ?? 0 }))
                }
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={deleteFeature}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Eliminar tarea
              </Button>
            ) : (
              <span />
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveFeature} disabled={!form.titulo.trim()}>
              {editingId ? "Guardar cambios" : "Crear funcionalidad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
