import { createClient } from '@supabase/supabase-js'
import type { Handler } from '@netlify/functions'

function slugify(text: string) {
  return text.toString()
	.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	.toLowerCase().trim()
	.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST')
	return { statusCode: 405, body: 'Method not allowed' }

  try {
	const { title, address, user_id, image_url, image_path } = JSON.parse(event.body || '{}')

	if (!title || !address || !user_id)
	  return { statusCode: 400, body: 'Missing fields (title, address, user_id)' }

	const slug = slugify(title)

	const { data, error } = await supabaseAdmin
	  .from('properties')
	  .insert({
		title,
		address,
		slug,
		created_by: user_id,
		image_url: image_url ?? null,
		image_path: image_path ?? null,
	  })
	  .select()
	  .single()

	if (error) return { statusCode: 500, body: error.message }

	return {
	  statusCode: 200,
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify(data)
	}
  } catch (err: any) {
	return { statusCode: 500, body: `Unexpected: ${err.message || err}` }
  }
}