import type { Handler } from '@netlify/functions';
import { ensureConfig, serviceSupabase, json, parseBody, emptyOrNull } from './_shared';
import { fetchCatastroFachadaBuffer } from './_catastroConsulta';

const PROPERTY_IMAGES_BUCKET = 'property-images';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      const referencia =
        event.queryStringParameters?.referencia?.trim() ||
        event.queryStringParameters?.ReferenciaCatastral?.trim() ||
        '';
      if (!referencia) {
        return json({ error: 'Indica una referencia catastral' }, 400);
      }

      const buffer = await fetchCatastroFachadaBuffer(referencia);
      if (!buffer) {
        return json({ error: 'No hay foto de fachada para esta referencia' }, 404);
      }

      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
      };
    }

    if (event.httpMethod === 'POST') {
      const body = parseBody(event.body);
      const referencia = String(body.referencia ?? '').trim();
      if (!referencia) {
        return json({ error: 'Indica una referencia catastral' }, 400);
      }

      const buffer = await fetchCatastroFachadaBuffer(referencia);
      if (!buffer) {
        return json({ error: 'No hay foto de fachada para esta referencia' }, 404);
      }

      const propertyId = emptyOrNull(body.propertyId);
      if (!propertyId) {
        return json({
          base64: buffer.toString('base64'),
          mimeType: 'image/jpeg',
        });
      }

      ensureConfig();
      const supabase = serviceSupabase();
      const filePath = `propiedades/${propertyId}/${Date.now()}-catastro.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) {
        console.error('[catastroFachada] upload', uploadError);
        return json({ error: uploadError.message }, 500);
      }

      const { data, error } = await supabase
        .from('propiedades')
        .update({ foto_destacada_path: filePath })
        .eq('id', propertyId)
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
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al obtener foto de fachada';
    console.error('[catastroFachada]', e);
    return json({ error: msg }, 500);
  }
};
