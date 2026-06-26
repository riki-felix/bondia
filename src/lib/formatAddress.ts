export interface AddressSuggestion {
  label: string;
  street?: string;
  housenumber?: string;
  city?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
}

export interface PostalAddressParts {
  street: string;
  number: string;
  city: string;
}

export function composePostalAddress(parts: PostalAddressParts): string {
  const segments: string[] = [];
  const street = parts.street.trim();
  const number = parts.number.trim();
  const city = parts.city.trim();

  if (street) segments.push(street);
  if (number) segments.push(number);
  if (city) segments.push(city);

  return segments.join(", ");
}

/** Parsea "Calle, número, ciudad" (formato habitual en ES). */
export function parsePostalAddress(direccion: string | null | undefined): PostalAddressParts {
  const raw = (direccion ?? "").trim();
  if (!raw) return { street: "", number: "", city: "" };

  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return { street: "", number: "", city: "" };
  if (parts.length === 1) return { street: parts[0], number: "", city: "" };

  const city = parts[parts.length - 1];
  const beforeCity = parts[parts.length - 2];

  if (parts.length >= 3 && /^\d/.test(beforeCity)) {
    return {
      street: parts.slice(0, -2).join(", "),
      number: beforeCity,
      city,
    };
  }

  return {
    street: parts.slice(0, -1).join(", "),
    number: "",
    city,
  };
}

export function suggestionToParts(item: AddressSuggestion): PostalAddressParts {
  return {
    street: item.street?.trim() || item.label.split(",")[0]?.trim() || "",
    number: item.housenumber?.trim() || "",
    city: item.city?.trim() || "",
  };
}

export function formatPhotonProperties(
  props: Record<string, string | undefined>
): string {
  const parts: string[] = [];

  if (props.street) {
    const line = props.housenumber
      ? `${props.street}, ${props.housenumber}`
      : props.street;
    parts.push(line);
  } else if (props.name) {
    parts.push(props.name);
  }

  const city = props.city || props.locality || props.town || props.municipality;
  if (city) parts.push(city);

  return parts.join(", ");
}

/** Construye consulta de geocoding a partir del título operativo (sin modificar el título). */
export function geocodeQueryFromTitulo(titulo: string): string {
  const raw = titulo.trim();
  if (!raw) return "";

  const isLH = /\s+L\s*['\u2019]?\s*H\s*$/i.test(raw);
  let q = raw.replace(/\s+L\s*['\u2019]?\s*H\s*$/i, "");
  q = q.replace(/\s+ESC\s+\d+.*$/i, "");
  q = q.replace(/\s+BJOS\s+.*$/i, "");
  q = q.replace(/\s+BAJOS\s+.*$/i, "");
  q = q.replace(/\s+\d+\s*º\s*.*$/i, "");
  q = q.replace(/\s+(AT|BAJOS|PRAL|SOB AT|ENT|ENTLO)\s+.*$/i, "");
  q = q.replace(/\s+/g, " ").trim();

  if (!q) return "";

  const city = isLH ? "L'Hospitalet de Llobregat, España" : "Barcelona, España";
  return `${q}, ${city}`;
}
