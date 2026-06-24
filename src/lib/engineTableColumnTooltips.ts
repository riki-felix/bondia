import tooltips from "@/data/engineTableColumnTooltips.json";

export type EngineTableId = keyof typeof tooltips;

export type InversionesColumnKey = keyof (typeof tooltips)["inversiones"];
export type LiquidacionesColumnKey = keyof (typeof tooltips)["liquidaciones"];

export function getEngineColumnTooltip<T extends EngineTableId>(
  table: T,
  column: keyof (typeof tooltips)[T]
): string {
  return tooltips[table][column] as string;
}
