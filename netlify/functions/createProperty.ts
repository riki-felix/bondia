// netlify/functions/createProperty.ts
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing envs', { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY })
  throw new Error('Server misconfig: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export const handler: Handler = async (event) => {
  try {
	if (event.httpMethod !== 'POST') {
	  return { statusCode: 405, body: 'Method Not Allowed' }
	}

	// Aceptamos multipart/form-data
	const contentType = event.headers['content-type'] || event.headers['Content-Type']
	if (!contentType?.includes('multipart/form-data')) {
	  return { statusCode: 400, body: 'Expected multipart/form-data' }
	}

	// Parse sencillo usando undici (web-std) disponible en Netlify runtime
	// @ts-ignore
	const formData = await (await import('undici')).FormData
	// @ts-ignore
	const fileFrom = (await import('undici')).File

	// Re-construimos formdata desde el body crudo (Netlify entrega base64)
	const boundary = contentType.split('boundary=')[1]
	const bodyBuffer = Buffer.from(event.body!, event.isBase64Encoded ? 'base64' : 'utf8')
	const { Blob } = await import('buffer')
	const blob = new Blob([bodyBuffer])
	const fd = await (await import('formdata-node')).FormData.from(blob, boundary)

	const title = fd.get('title')?.toString().trim()
	const address = fd.get('address')?.toString().trim()
	const file = fd.get('image') as any // File | null

	if (!title || !address) {
	  return { statusCode: 400, body: 'Missing title or address' }
	}

	let imagePath: string | null = null

	if (file && file.name && file.size > 0) {
	  const ext = (file.name as string).split('.').pop()?.toLowerCase() || 'jpg'
	  const fileName = `${crypto.randomUUID()}.${ext}`
	  const objectPath = `uploads/${fileName}`

	  // Subimos al bucket público
	  const uploadRes = await supabase.storage
		.from('property-images')
		.upload(objectPath, file.stream(), {
		  contentType: file.type || 'image/jpeg',
		  upsert: false
		})

	  if (uploadRes.error) {
		return { statusCode: 500, body: `Upload error: ${uploadRes.error.message}` }
	  }

	  imagePath = uploadRes.data.path
	}

	// Insertamos la fila
	const insertRes = await supabase.from('properties').insert({
	  title,
	  address,
	  image_path: imagePath
	}).select().single()

	if (insertRes.error) {
	  return { statusCode: 500, body: `DB error: ${insertRes.error.message}` }
	}

	return {
	  statusCode: 200,
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify(insertRes.data)
	}
  } catch (err: any) {
	return { statusCode: 500, body: `Unexpected: ${err.message || err}` }
  }
}
console.log('🔑 SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('🔑 SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY)