// netlify/functions/_normalizeDireccion.ts
// Mantener en sync con src/lib/normalizeDireccion.ts

export function normalizeTituloOperativo(input: string | null | undefined): string | null {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;

  s = s.replace(/\s+/g, ' ');
  s = s.replace(/[''`´'\u2018\u2019\u201A\u201B]/g, "'");
  s = s.replace(/D´/gi, "D'");

  s = s
    .replace(/º/g, '\uE000')
    .replace(/ª/g, '\uE001')
    .replace(/·/g, '\uE002');

  s = s.toLocaleUpperCase('es-ES');

  s = s
    .replace(/\uE000/g, 'º')
    .replace(/\uE001/g, 'ª')
    .replace(/\uE002/g, '·');

  s = s.replace(/\bL\s*'\s*H\b/g, "L'H");
  s = s.replace(/^C\/\s*/i, 'C/ ');
  s = s.replace(/^AV\.?\s+/i, 'AV. ');

  s = s.replace(/\bBJOS\b/g, 'BAJOS');
  s = s.replace(/\bENTRO\b/g, 'ENT');
  s = s.replace(/\bATC\b/g, 'AT');

  s = s.replace(/º(\d)/g, 'º $1');
  s = s.replace(/º([12]ª)/g, 'º $1');

  s = s.replace(/\bESC\s*(\d)/g, 'ESC $1');
  s = s.replace(/\bENT\s*(\d)/g, 'ENT $1');

  s = s.replace(/\s+/g, ' ').trim();
  return s || null;
}

export function normalizeDireccionPostal(input: string | null | undefined): string | null {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;

  s = s.replace(/\s+/g, ' ');
  s = s.replace(/[''`´'\u2018\u2019\u201A\u201B]/g, "'");
  return s.trim() || null;
}
