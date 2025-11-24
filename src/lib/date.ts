// src/lib/date.ts

// Mapa de meses abreviados estilo "Ene", "Feb", "Mar", "Abr", "May", ...
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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