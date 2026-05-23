// netlify/functions/uploadPropertyFoto.ts
import type { Handler } from '@netlify/functions';
import { ensureConfig, serviceSupabase, json, parseBody, emptyOrNull } from './_shared';

const PROPERTY_IMAGES_BUCKET = 'property-images';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    ensureConfig();
    const body = parseBody(event.body);
    const id = emptyOrNull(body.id);
    if (!id) return json({ error: 'id requerido' }, 400);

    const base64 = body.base64;
    if (!base64 || typeof base64 !== 'string') {
      return json({ error: 'base64 requerido' }, 400);
    }

    const mimeType =
      typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')
        ? body.mimeType
        : 'image/jpeg';

    const supabase = serviceSupabase();
    const buffer = Buffer.from(base64, 'base64');
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const filePath = `propiedades/${id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(filePath, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error('[uploadPropertyFoto]', uploadError);
      return json({ error: uploadError.message }, 500);
    }

    const { data, error } = await supabase
      .from('propiedades')
      .update({ foto_destacada_path: filePath })
      .eq('id', id)
      .select('foto_destacada_path')
      .single();

    if (error) {
      await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([filePath]);
      return json({ error: error.message }, 500);
    }

    const { data: urlData } = supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .getPublicUrl(data.foto_destacada_path);

    return json({
      foto_destacada_path: data.foto_destacada_path,
      publicUrl: urlData.publicUrl,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error inesperado';
    console.error('[uploadPropertyFoto] fatal:', e);
    return json({ error: message }, 500);
  }
};
