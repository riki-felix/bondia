// src/scripts/new-property.js
import { supabase } from '/src/scripts/supabaseClient.js';

export default function initNewPropertyForm() {
  const enhance = () => {
	const form = document.getElementById("f");
	const msg = document.getElementById("msg");

	if (!form) {
	  console.warn("⚠️ No se encontró #f");
	  return;
	}

	console.log("🟢 DOM listo, script ejecutado");

	form.addEventListener("submit", async (e) => {
	  e.preventDefault();
	  msg.textContent = "Guardando...";
	  msg.className = "";

	  const fd = new FormData(form);
	  const title = fd.get("title")?.toString().trim();
	  const address = fd.get("address")?.toString().trim();

	  try {
		// ← obtenemos la sesión para mandar user_id al backend
		const { data: { session } } = await supabase.auth.getSession();
		const user_id = session?.user?.id;
		if (!user_id) {
		  throw new Error("No hay sesión. Inicia sesión de nuevo.");
		}

		const res = await fetch("/.netlify/functions/createProperty", {
		  method: "POST",
		  headers: { "Content-Type": "application/json" },
		  body: JSON.stringify({ title, address, user_id }),
		  credentials: "same-origin",
		});

		if (!res.ok) throw new Error(await res.text());
		const data = await res.json();

		msg.className = "ok";
		msg.innerHTML = `✅ Propiedad creada<br><a href="/propiedad/${data.id}">Ver propiedad</a>`;
		form.reset();
	  } catch (err) {
		msg.className = "err";
		msg.textContent = "❌ " + (err.message || err);
	  }
	});
  };

  if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", enhance, { once: true });
  } else {
	enhance();
  }
}

console.log("📦 new-property.js importado");