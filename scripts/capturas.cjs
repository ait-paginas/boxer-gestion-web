#!/usr/bin/env node
/*
 * Capturas de pantalla de la web, en compu y en celular, para mostrar el cambio
 * antes de pasarlo a main.
 *
 *   node scripts/capturas.cjs <carpeta-salida> [pagina.html ...]
 *
 * Levanta la web local (python3 -m http.server) y saca, por pagina, una
 * captura completa de escritorio (1366 px) y una de celular (390 px). Sin
 * paginas, saca todas. Avisa por consola de errores de JS y de archivos que
 * no cargan (404). No envia formularios.
 *
 * Usa el Playwright que ya trae el entorno de Claude Code (Chromium en
 * /opt/pw-browsers). Si `require('playwright')` falla: npm i -g playwright
 * sin descargar navegadores (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1).
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = 8765;
const [salida, ...pedidas] = process.argv.slice(2);
if (!salida) { console.error('uso: node scripts/capturas.cjs <carpeta-salida> [pagina.html ...]'); process.exit(2); }
const paginas = pedidas.length ? pedidas : fs.readdirSync(RAIZ).filter(f => f.endsWith('.html')).sort();
fs.mkdirSync(salida, { recursive: true });

const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PUERTO), '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
  await espera(800);
  const nav = await chromium.launch();
  let problemas = 0;
  try {
    for (const pag of paginas) {
      for (const [nombre, vista] of [['compu', { width: 1366, height: 900 }], ['celu', { width: 390, height: 844 }]]) {
        const ctx = await nav.newContext({ viewport: vista, deviceScaleFactor: 1, isMobile: nombre === 'celu', reducedMotion: 'reduce' });
        const p = await ctx.newPage();
        // No mandar nada a n8n, Google ni Meta desde una prueba.
        await p.route(/n8n\.cloud|googletagmanager|google-analytics|googleadservices|facebook|doubleclick/, r => r.abort());
        p.on('pageerror', e => { problemas++; console.log(`  [${pag} ${nombre}] error de JS: ${e.message}`); });
        p.on('response', r => {
          if (r.status() >= 400 && r.url().includes(`127.0.0.1:${PUERTO}`)) {
            problemas++; console.log(`  [${pag} ${nombre}] ${r.status()} ${r.url().split(String(PUERTO))[1]}`);
          }
        });
        await p.goto(`http://127.0.0.1:${PUERTO}/${pag}`, { waitUntil: 'networkidle' });
        // Las secciones aparecen al scrollear: recorrer la pagina para que se muestren.
        await p.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
          window.scrollTo(0, 0);
        });
        await espera(600);
        const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
        if (ancho > vista.width + 1) { problemas++; console.log(`  [${pag} ${nombre}] se desborda de costado (${ancho}px de ${vista.width})`); }
        const archivo = path.join(salida, `${pag.replace('.html', '')}-${nombre}.png`);
        await p.screenshot({ path: archivo, fullPage: true });
        console.log(`  ${archivo}`);
        await ctx.close();
      }
    }
  } finally {
    await nav.close();
    srv.kill();
  }
  console.log(problemas ? `\n${problemas} problema(s) para revisar` : '\nSin errores de JS, 404 ni desbordes');
})();
