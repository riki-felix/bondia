// src/lib/text.ts
export function normalize(str: string | null | undefined): string {
  return String(str || "")
	.normalize("NFD")
	.replace(/[\u0300-\u036f]/g, "")
	.toLowerCase()
	.trim();
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
  });
}