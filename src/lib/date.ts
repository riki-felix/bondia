// src/lib/date.ts

// Mapa de meses abreviados estilo "Ene", "Feb", "Mar", "Abr", "May", ...
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const MONTHS_ES_FULL = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function monthKeyFromDateKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLoadLabel(monthKey: string): string {
  const month = Number(monthKey.split("-")[1]);
  return MONTHS_ES_FULL[month - 1] ?? monthKey;
}

// Convierte una fecha a "15 Abr 2025"
export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return "—";

  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";

  const day = d.getDate();
  const month = MONTHS_ES[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}