import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const sb = createClient(SUPABASE_URL, SUPABASE_ANON)

export function initNewPropertyForm() {
  const form = document.getElementById('f')
  const msg  = document.getElementById('msg')

  if (!form) return

  form.addEventListener('submit', async (e) => {
	e.preventDefault()
	msg.className = ''
	msg.textContent = 'Guardando...'

	const fd = new FormData(form)
	const title = fd.get('title')?.toString().trim()
	const address = fd.get('address')?.toString().trim()
	const file = fd.get('image')

	try {
	  let image_path = null

	  if (file && file.size > 0) {
		const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
		const fileName = `${crypto.randomUUID()}.${ext}`
		const objectPath = `uploads/${fileName}`

		const { data, error } = await sb.storage
		  .from('property-images')
		  .upload(objectPath, file, { upsert: false })

		if (error) throw new Error('Upload: ' + error.message)
		image_path = data.path
	  }

	  const res = await fetch('/.netlify/functions/createProperty', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title, address, image_path }),
	  })

	  if (!res.ok) throw new Error(await res.text())
	  const prop = await res.json()

	  msg.className = 'ok'
	  msg.innerHTML = '✅ Propiedad creada. <a href="/propiedad/' + prop.id + '">Ver propiedad</a>'
	  form.reset()
	} catch (err) {
	  msg.className = 'err'
	  msg.textContent = '❌ ' + (err.message || err)
	}
  })
}