/**
 * Evita `npm run build` mientras netlify dev está activo.
 * Un build de producción regenera dist/ y .netlify/build y hace que netlify dev
 * deje de servir las functions de netlify/functions/ (404 en assets y API).
 */
import net from "node:net";

const NETLIFY_DEV_PORT = Number(process.env.NETLIFY_DEV_PORT || 8888);

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
    socket.connect(port, "127.0.0.1");
  });
}

if (process.env.FORCE_BUILD === "1") {
  process.exit(0);
}

if (await isPortOpen(NETLIFY_DEV_PORT)) {
  console.error("");
  console.error(`⚠️  netlify dev está activo (puerto ${NETLIFY_DEV_PORT}).`);
  console.error("   npm run build rompe el servidor de desarrollo.");
  console.error("   Usa npm run check para verificar tipos sin interrumpir el dev.");
  console.error("   Para forzar el build: FORCE_BUILD=1 npm run build");
  console.error("");
  process.exit(1);
}
