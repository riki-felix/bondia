#!/usr/bin/env node
/**
 * Valida coherencia financiera de inversiones en propiedades.
 * Uso: node scripts/verificar-inversiones-propiedades.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
  console.error("Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE en .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: props, error } = await supabase
  .from("propiedades")
  .select(
    "id, numero_operacion, titulo, beneficio_bruto, retribucion, ingreso_banco, jasp_10_percent, efectivo, liquidacion, fecha_liquidacion, fecha_transferencia, numero_op_liquidacion"
  )
  .eq("tipo", "inversion")
  .order("numero_operacion");

if (error) {
  console.error(error.message);
  process.exit(1);
}

let issues = 0;

for (const p of props ?? []) {
  if (p.liquidacion && !p.fecha_liquidacion) {
    console.log(`⚠ Op ${p.numero_operacion}: liquidada sin fecha_liquidacion`);
    issues++;
  }
  if (p.liquidacion && (Number(p.ingreso_banco) || 0) <= 0 && (Number(p.retribucion) || 0) > 0) {
    console.log(`⚠ Op ${p.numero_operacion}: liquidada sin ingreso_banco`);
    issues++;
  }
}

const op56 = (props ?? []).find((p) => p.numero_operacion === 56);
if (op56) {
  console.log("\n— Op #56 (caso referencia) —");
  console.log("  bruto:", op56.beneficio_bruto);
  console.log("  retribución:", op56.retribucion);
  console.log("  JASP:", op56.jasp_10_percent);
  console.log("  efectivo:", op56.efectivo);
}

console.log(
  issues === 0
    ? `\n✓ ${props?.length ?? 0} operaciones: datos coherentes`
    : `\n✗ ${issues} avisos`
);
process.exit(issues > 0 ? 1 : 0);
