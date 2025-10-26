// Este archivo se ejecuta SOLO en el navegador.
// Envía las credenciales al endpoint SSR, que escribe cookies para el middleware.

async function postToServer(payload) {
  const res = await fetch('/api/auth/set', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify(payload),
	credentials: 'same-origin',
  });
  if (!res.ok) {
	let msg = 'unknown';
	try { const j = await res.json(); msg = j?.error || msg; }
	catch { msg = await res.text(); }
	throw new Error(msg);
  }
}

function getNextUrl() {
  const u = new URL(location.href);
  return u.searchParams.get('next') || '/admin';
}

window.addEventListener('load', async () => {
  const dbg = document.getElementById('dbg');
  const logErr = (m) => { if (dbg) dbg.textContent += '\n\nERROR: ' + m; };

  try {
	const url = new URL(location.href);

	// 1) ?code=...  (PKCE/OAuth)
	if (url.searchParams.get('code')) {
	  await postToServer({ codeUrl: url.href });
	  history.replaceState({}, '', '/auth/callback');
	  location.replace(getNextUrl());
	  return;
	}

	// 2) #access_token / #refresh_token  (magic link clásico)
	if (location.hash.includes('access_token')) {
	  const h = new URLSearchParams(location.hash.slice(1));
	  const access_token  = h.get('access_token');
	  const refresh_token = h.get('refresh_token');
	  if (!access_token || !refresh_token) {
		throw new Error('Magic link sin tokens (#access_token / #refresh_token)');
	  }
	  await postToServer({ access_token, refresh_token });
	  history.replaceState({}, '', '/auth/callback');
	  location.replace(getNextUrl());
	  return;
	}

	// 3) ?token_hash=&type=magiclink  (verifyOtp)
	if (url.searchParams.get('token_hash')) {
	  const token_hash = url.searchParams.get('token_hash');
	  const type = url.searchParams.get('type') || 'magiclink';
	  await postToServer({ token_hash, type });
	  history.replaceState({}, '', '/auth/callback');
	  location.replace(getNextUrl());
	  return;
	}

	throw new Error('No se encontraron credenciales en la URL');
  } catch (err) {
	const msg = err?.message || String(err);
	logErr(msg);
	const q = new URLSearchParams({ error: msg });
	location.replace(`/login?${q.toString()}`);
  }
});