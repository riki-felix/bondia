import type { AddressSuggestion } from "./formatAddress";

export async function searchAddresses(
  q: string,
  limit = 6
): Promise<AddressSuggestion[]> {
  const trimmed = q.trim();
  if (trimmed.length < 3) return [];

  const res = await fetch("/.netlify/functions/searchAddress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: trimmed, limit }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }

  return (data as { results?: AddressSuggestion[] }).results ?? [];
}
