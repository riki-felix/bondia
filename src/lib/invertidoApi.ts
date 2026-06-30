import type { InvertidoByYear } from "./invertidoStorage";
import { round2 } from "./moneyCalc";

export interface InvertidoEjercicioRow {
  ejercicio: number;
  importe: number;
}

export function invertidoRowsToByYear(
  rows: InvertidoEjercicioRow[]
): InvertidoByYear {
  const out: InvertidoByYear = {};
  for (const row of rows) {
    const ejercicio = Number(row.ejercicio);
    const importe = round2(Number(row.importe) || 0);
    if (Number.isFinite(ejercicio) && importe > 0) {
      out[String(ejercicio)] = importe;
    }
  }
  return out;
}

export async function saveInvertidoEjercicios(
  byYear: InvertidoByYear
): Promise<InvertidoByYear> {
  const res = await fetch("/.netlify/functions/updateInvertidoEjercicios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ byYear }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Error al guardar invertido"
    );
  }
  return (data.byYear ?? {}) as InvertidoByYear;
}
