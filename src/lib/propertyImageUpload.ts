/** Sube la foto destacada vía Netlify (service role); evita fallos silenciosos de RLS en el cliente. */

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer la imagen"));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) reject(new Error("No se pudo leer la imagen"));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

export async function uploadPropertyFeaturedImage(
  propertyId: string,
  file: File
): Promise<{ foto_destacada_path: string; publicUrl: string }> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/.netlify/functions/uploadPropertyFoto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: propertyId,
      base64,
      mimeType: file.type || "image/jpeg",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Error al subir la imagen"
    );
  }
  return {
    foto_destacada_path: data.foto_destacada_path,
    publicUrl: data.publicUrl,
  };
}
