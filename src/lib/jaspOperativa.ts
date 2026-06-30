import {
  calcBrutoFromRetribucion,
  calcRetencion,
  round2,
} from "./moneyCalc";

export interface JaspOperativaInput {
  beneficioBruto: number;
  participacionJasp: number;
  participacionSanyus: number;
  retribucion: number;
  ingresoBanco: number;
}

export interface JaspOperativaBreakdown {
  /** 20% del bruto contable — importe factura JASP */
  jaspContable: number;
  /** 20% del bruto real (tras dar por cobrado) */
  jaspReal: number;
  /** Parte ya materializada en efectivo atribuida a JASP */
  darPorCobrado: number;
  baseImponible: number;
  iva: number;
  facturaTotal: number;
  /** Beneficio neto JASP tras IVA */
  neto: number;
  brutoReal: number;
  efectivo: number;
}

/**
 * Desglose operativo JASP (hoja liquidación JASP / Muntanyola).
 * El efectivo de la parte Sanyus (40%) se reparte proporcionalmente al dar por cobrado de JASP.
 */
export function computeJaspOperativa(
  input: JaspOperativaInput
): JaspOperativaBreakdown {
  const pctJasp = input.participacionJasp;
  const pctRef = input.participacionSanyus > 0 ? input.participacionSanyus : 40;
  const retribucion = round2(Math.max(0, input.retribucion));
  const ingresoBanco = round2(Math.max(0, input.ingresoBanco));

  const bruto =
    input.beneficioBruto > 0
      ? round2(input.beneficioBruto)
      : calcBrutoFromRetribucion(retribucion, pctRef);

  const retencion = calcRetencion(retribucion);
  const efectivo = round2(retribucion - retencion - ingresoBanco);

  const darPorCobradoRef = efectivo;
  const darPorCobradoJasp = round2(efectivo * (pctJasp / pctRef));
  const darPorCobradoTotal = round2(2 * darPorCobradoRef + darPorCobradoJasp);

  const brutoReal = round2(Math.max(0, bruto - darPorCobradoTotal));
  const jaspContable = round2((bruto * pctJasp) / 100);
  const jaspReal = round2((brutoReal * pctJasp) / 100);
  const darPorCobrado = round2(jaspContable - jaspReal);

  const facturaTotal = jaspContable;
  const baseImponible = round2(facturaTotal / 1.21);
  const iva = round2(facturaTotal - baseImponible);
  const neto = round2(jaspReal - iva);

  return {
    jaspContable,
    jaspReal,
    darPorCobrado,
    baseImponible,
    iva,
    facturaTotal,
    neto,
    brutoReal,
    efectivo,
  };
}
