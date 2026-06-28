import type { MercadoReferenciaBundle } from "./mercadoReferencia";

export interface RefreshMercadoReferenciaResult {
  bundle: MercadoReferenciaBundle;
  mitmaUpdated: boolean;
  idealistaUpdated: boolean;
  idealistaNote: string | null;
}

export async function refreshMercadoReferencia(): Promise<RefreshMercadoReferenciaResult> {
  const res = await fetch("/.netlify/functions/refreshMercadoReferencia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }

  return data as RefreshMercadoReferenciaResult;
}
