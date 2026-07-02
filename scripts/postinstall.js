// scripts/postinstall.js
// Descarga el binario standalone de yt-dlp durante npm install

import { writeFileSync, chmodSync } from 'fs';
import { join } from 'path';

const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
const OUTPUT = join(process.cwd(), 'yt-dlp');

// Solo descargar en Linux (Railway), no en Windows (desarrollo local)
if (process.platform !== 'linux') {
  console.log('[postinstall] No es Linux, saltando descarga de yt-dlp');
  process.exit(0);
}

console.log('[postinstall] Descargando yt-dlp...');

try {
  const res = await fetch(YTDLP_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(OUTPUT, buffer);
  chmodSync(OUTPUT, 0o755);

  console.log(`[postinstall] yt-dlp descargado (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
} catch (err) {
  console.error('[postinstall] Error descargando yt-dlp:', err.message);
  process.exit(0); // No bloquear el build si falla
}
