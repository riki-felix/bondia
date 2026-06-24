// src/lib/diarioTimeline.ts

import { formatDateShort, monthKeyFromDateKey } from "@/lib/date";

export { monthKeyFromDateKey };

export type FeatureTask = {
  id: string;
  titulo: string;
  descripcion: string;
  progreso: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type DiarioTimelineEntryType = "created" | "carried" | "completed";

export interface DiarioTimelineEntry {
  type: DiarioTimelineEntryType;
  taskId: string;
  titulo: string;
  progreso: number;
}

export interface DiarioTimelineDay {
  date: string;
  label: string;
  entries: DiarioTimelineEntry[];
}

function clampProgress(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

export function toLocalDateKey(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return toLocalDateKey(new Date());
}

function eachDayInclusive(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cur <= last) {
    days.push(toLocalDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Día de cierre: completed_at o, si ya está al 100 %, updated_at como respaldo */
export function resolveCompletedDay(task: FeatureTask): string | null {
  const progreso = clampProgress(task.progreso);
  if (progreso < 100) return null;
  if (task.completed_at) return toLocalDateKey(task.completed_at);
  return toLocalDateKey(task.updated_at);
}

function isTaskOpen(task: FeatureTask): boolean {
  return clampProgress(task.progreso) < 100;
}

function compareEntries(a: DiarioTimelineEntry, b: DiarioTimelineEntry): number {
  const order: Record<DiarioTimelineEntryType, number> = {
    created: 0,
    carried: 1,
    completed: 2,
  };
  const byType = order[a.type] - order[b.type];
  if (byType !== 0) return byType;
  return a.titulo.localeCompare(b.titulo, "es");
}

export function buildDiarioTimeline(tasks: FeatureTask[]): DiarioTimelineDay[] {
  if (tasks.length === 0) return [];

  const today = todayKey();

  const firstDay = tasks.reduce((min, task) => {
    const key = toLocalDateKey(task.created_at);
    return key < min ? key : min;
  }, toLocalDateKey(tasks[0].created_at));

  const days = eachDayInclusive(firstDay, today);

  return days
    .map((date) => {
      const entries: DiarioTimelineEntry[] = [];
      const isToday = date === today;

      for (const task of tasks) {
        const createdDay = toLocalDateKey(task.created_at);
        const completedDay = resolveCompletedDay(task);
        const progreso = clampProgress(task.progreso);
        const base = {
          taskId: task.id,
          titulo: task.titulo,
          progreso,
        };

        if (createdDay === date) {
          entries.push({ ...base, type: "created" });
        }

        if (completedDay === date) {
          entries.push({ ...base, type: "completed" });
        }

        // Pendientes solo en el día actual; los días pasados solo guardan creada/completada
        if (isToday && isTaskOpen(task) && createdDay < today) {
          entries.push({ ...base, type: "carried" });
        }
      }

      entries.sort(compareEntries);

      return {
        date,
        label: formatDateShort(`${date}T12:00:00`),
        entries,
      };
    })
    .filter((day) => day.entries.length > 0)
    .reverse();
}

export function timelineEntryLabel(entry: DiarioTimelineEntry): string {
  switch (entry.type) {
    case "created":
      return "Creada";
    case "carried":
      return "Pendiente";
    case "completed":
      return "Completada";
  }
}
