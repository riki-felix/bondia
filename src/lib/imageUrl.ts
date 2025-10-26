// src/lib/imageUrl.ts
export const publicImageUrl = (path?: string | null) => {
  if (!path) return null
  return `${import.meta.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${path}`
}