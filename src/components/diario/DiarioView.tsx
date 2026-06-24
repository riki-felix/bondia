import { useEffect, useMemo, useState } from "react";
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
import { Plus, CheckCircle2, Trash2, Circle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  currentMonthKey,
  formatMonthLoadLabel,
  previousMonthKey,
} from "@/lib/date";
import {
  buildDiarioTimeline,
  monthKeyFromDateKey,
  toLocalDateKey,
  type DiarioTimelineDay,
  type FeatureTask,
} from "@/lib/diarioTimeline";

interface DiarioViewProps {
  initialData: FeatureTask[];
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

function snapProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(clamp(value) / 5) * 5));
}

function progressRingClass(progress: number): string {
  const safe = clamp(progress);
  if (safe >= 50) return "text-teal-500";
  if (safe >= 25) return "text-yellow-500";
  return "text-red-300";
}

function StatusIcon({ progress }: { progress: number }) {
  const safe = clamp(progress);

  if (safe >= 100) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
  }

  const ringClass = progressRingClass(safe);

  if (safe > 0) {
    const size = 20;
    const stroke = 2.5;
    const center = size / 2;
    const radius = (size - stroke) / 2;
    const visiblePct = Math.min(100, Math.max(8, safe));

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`shrink-0 ${ringClass}`}
        aria-label={`Progreso ${safe}%`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          opacity={0.3}
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
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

  return (
    <div
      className={`h-5 w-5 rounded-full border-2 border-dashed shrink-0 ${ringClass} border-current bg-red-50`}
      aria-label="Progreso 0%"
    />
  );
}

function filterTimelineByMonths(
  days: DiarioTimelineDay[],
  loadedMonths: Set<string>
): DiarioTimelineDay[] {
  return days.filter((day) => loadedMonths.has(monthKeyFromDateKey(day.date)));
}

function resolveNextMonthToLoad(
  loadedMonths: Set<string>,
  allDays: DiarioTimelineDay[]
): string | null {
  if (allDays.length === 0) return null;

  const oldestLoaded = [...loadedMonths].sort()[0];
  const previous = previousMonthKey(oldestLoaded);
  const firstMonth = monthKeyFromDateKey(allDays[allDays.length - 1].date);

  if (previous < firstMonth || loadedMonths.has(previous)) return null;
  return previous;
}

function filterTimelineDays(
  days: DiarioTimelineDay[],
  showPending: boolean,
  showCompleted: boolean
): DiarioTimelineDay[] {
  if (showPending && showCompleted) return days;
  if (!showPending && !showCompleted) return days;

  return days
    .map((day) => ({
      ...day,
      entries: day.entries.filter((entry) => {
        const isCompletedTask = clamp(entry.progreso) >= 100;
        if (showPending && !showCompleted) return !isCompletedTask;
        if (!showPending && showCompleted) return isCompletedTask;
        return true;
      }),
    }))
    .filter((day) => day.entries.length > 0);
}

async function postJson(
  url: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        /function not found/i.test(text)
          ? "API no disponible. Arranca con npm run dev:netlify para guardar cambios."
          : "Respuesta inválida del servidor"
      );
    }
  }
  if (!res.ok) {
    throw new Error((data.error as string) || "Error en la petición");
  }
  return data;
}

function isPastDay(dateKey: string): boolean {
  return dateKey < toLocalDateKey(new Date());
}

export default function DiarioView({ initialData }: DiarioViewProps) {
  const [items, setItems] = useState<FeatureTask[]>(initialData);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filterPending, setFilterPending] = useState(false);
  const [filterCompleted, setFilterCompleted] = useState(false);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(
    () => new Set([currentMonthKey()])
  );

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const pendingCount = useMemo(
    () => items.filter((item) => clamp(item.progreso) < 100).length,
    [items]
  );

  const timelineDays = useMemo(() => buildDiarioTimeline(items), [items]);

  const monthFilteredDays = useMemo(
    () => filterTimelineByMonths(timelineDays, loadedMonths),
    [timelineDays, loadedMonths]
  );

  const visibleTimelineDays = useMemo(
    () => filterTimelineDays(monthFilteredDays, filterPending, filterCompleted),
    [monthFilteredDays, filterPending, filterCompleted]
  );

  const nextMonthToLoad = useMemo(
    () => resolveNextMonthToLoad(loadedMonths, timelineDays),
    [loadedMonths, timelineDays]
  );

  const loadPreviousMonth = () => {
    if (!nextMonthToLoad) return;
    setLoadedMonths((prev) => new Set([...prev, nextMonthToLoad]));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (item: FeatureTask) => {
    setEditingId(item.id);
    setForm({
      titulo: item.titulo,
      descripcion: item.descripcion,
      progreso: snapProgress(item.progreso),
    });
    setOpen(true);
  };

  const openEditById = (taskId: string) => {
    const item = items.find((i) => i.id === taskId);
    if (item) openEdit(item);
  };

  const saveFeature = async () => {
    const titulo = form.titulo.trim();
    if (!titulo) return;

    try {
      if (editingId) {
        const data = (await postJson("/.netlify/functions/updateFeatureTask", {
          id: editingId,
          titulo,
          descripcion: form.descripcion.trim(),
          progreso: snapProgress(form.progreso),
        })) as FeatureTask;
        setItems((prev) => prev.map((item) => (item.id === editingId ? data : item)));
        toast.success("Tarea actualizada");
      } else {
        const data = (await postJson("/.netlify/functions/createFeatureTask", {
          titulo,
          descripcion: form.descripcion.trim(),
          progreso: snapProgress(form.progreso),
        })) as FeatureTask;
        setItems((prev) => [data, ...prev]);
        toast.success("Tarea creada");
      }

      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error guardando tarea");
    }
  };

  const deleteFeature = async () => {
    if (!editingId) return;

    try {
      await postJson("/.netlify/functions/deleteFeatureTask", { id: editingId });

      setItems((prev) => prev.filter((item) => item.id !== editingId));
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      toast.success("Tarea eliminada");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar tarea");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Diario</h1>
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "Registro diario de tareas creadas, pendientes y completadas"
              : `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"} · ${items.length} en total`}
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Añadir
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            filterPending
              ? "border-yellow-500/70 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
              : "text-muted-foreground"
          )}
          onClick={() => setFilterPending((v) => !v)}
        >
          Pendientes
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            filterCompleted
              ? "border-emerald-600/70 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              : "text-muted-foreground"
          )}
          onClick={() => setFilterCompleted((v) => !v)}
        >
          Completadas
        </Button>
      </div>

      {visibleTimelineDays.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {timelineDays.length === 0
            ? "Sin entradas todavía. Crea la primera tarea para empezar el diario."
            : monthFilteredDays.length === 0
              ? "Sin entradas en los meses cargados."
              : "Ninguna entrada coincide con los filtros activos."}
        </div>
      ) : (
        <div className="space-y-6">
          {visibleTimelineDays.map((day, dayIndex) => {
            const isToday = day.date === toLocalDateKey(new Date());
            const lineClass = isToday ? "bg-muted-foreground/50" : "bg-border";
            const dotClass = isToday ? "text-muted-foreground" : "text-border";

            return (
            <div key={day.date} className="relative pl-6">
              {dayIndex < visibleTimelineDays.length - 1 && (
                <div className={`absolute left-[7px] top-2 bottom-0 w-px ${lineClass}`} />
              )}
              <div className="absolute left-0 top-1.5">
                <Circle className={`h-4 w-4 fill-background ${dotClass}`} />
              </div>

              <div className="space-y-3">
                <h2
                  className={
                    isToday
                      ? "text-base font-semibold tracking-tight text-foreground"
                      : "text-sm font-semibold text-foreground"
                  }
                >
                  {isToday ? `Hoy, ${day.label}` : day.label}
                </h2>
                <ul className="space-y-2">
                  {day.entries.map((entry) => {
                    const isPastCreation =
                      entry.type === "created" && isPastDay(day.date);

                    if (isPastCreation) {
                      return (
                        <li
                          key={`${day.date}-${entry.type}-${entry.taskId}`}
                          className="px-3 py-1.5 text-sm text-muted-foreground"
                        >
                          <p className="leading-snug min-w-0">
                            <span>Creada:</span> {entry.titulo}
                          </p>
                        </li>
                      );
                    }

                    return (
                      <li key={`${day.date}-${entry.type}-${entry.taskId}`}>
                        <button
                          type="button"
                          onClick={() => openEditById(entry.taskId)}
                          className="flex w-full items-start gap-3 rounded-lg border bg-card px-3 py-2 text-sm text-left transition-colors hover:bg-muted/40"
                        >
                          <StatusIcon progress={entry.progreso} />
                          <p
                            className={cn(
                              "leading-snug min-w-0 flex-1",
                              entry.type === "completed" &&
                                "text-muted-foreground line-through decoration-2"
                            )}
                          >
                            {entry.titulo}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            );
          })}

          {nextMonthToLoad && (
            <div className="flex justify-center pt-2">
              <Button type="button" variant="outline" size="sm" onClick={loadPreviousMonth}>
                Cargar {formatMonthLoadLabel(nextMonthToLoad)}
              </Button>
            </div>
          )}
        </div>
      )}

      {visibleTimelineDays.length === 0 && nextMonthToLoad && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={loadPreviousMonth}>
            Cargar {formatMonthLoadLabel(nextMonthToLoad)}
          </Button>
        </div>
      )}

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
            <DialogTitle>{editingId ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
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
                placeholder="Notas rápidas de la tarea"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Estado</label>
                <span className="text-xs text-muted-foreground">{snapProgress(form.progreso)}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[snapProgress(form.progreso)]}
                onValueChange={(values) =>
                  setForm((prev) => ({ ...prev, progreso: snapProgress(values[0] ?? 0) }))
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
              {editingId ? "Guardar cambios" : "Crear tarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
