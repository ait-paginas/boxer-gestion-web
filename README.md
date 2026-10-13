# Web de Boxer Gestión — boxergestion.com

Este repo **es** la web: lo que está en `main` es lo que Netlify publica en
boxergestion.com. HTML estático, sin paso de build. Cada commit a `main` sale
publicado en uno o dos minutos.

Hasta el 2026-10-13 vivía en `web/boxer-gestion/` del repo del agente
(`joanavillarreal/agente-ga-web`). El historial anterior está ahí.

## Qué es cada página

| Archivo | Qué es | URL |
|---|---|---|
| `index.html` | Home | `/` |
| `modulos.html` | Módulos | `/modulos` |
| `planes.html` | Planes y comparativa de 21 filas (schema `FAQPage`) | `/planes` |
| `comunidad.html` | Comunidad + formulario del **curso de IA** | `/comunidad` |
| `asesoria.html` | Landing de la campaña de Demand Gen. `noindex`, sin menú | `/asesoria` |
| `sistema-gestion-casas-de-repuestos.html` | **Landing de Google Ads.** 8 módulos con video, preguntas frecuentes, título según `?tema=` | `/sistema-gestion-casas-de-repuestos` |
| `cerac-locro-2026.html` | Landing de evento vieja. No se tocó | `/cerac-locro-2026` |
| `assets/boxer.js` | Toda la interactividad de las 4 páginas principales (menú, carruseles, acordeón, formularios). Sin dependencias | — |
| `assets/google-ads.js` | Etiqueta de Google Ads y conversión "Lead formulario web" | — |
| `assets/meta-pixel.js` | Píxel de Meta "Facebook Pixel - Boxer" (`1084727415780829`) | — |
| `assets/` `uploads/` `img/` | Imágenes. `img/` la usan solo las landings viejas | — |
| `robots.txt` `sitemap.xml` `og-image.png` | SEO | — |
| `netlify.toml` | Le dice a Netlify que publique la raíz tal cual | — |

## La landing de Ads: cómo funciona `?tema=`

Es un solo HTML que cambia el título, la bajada y el módulo destacado según
cómo llegó la persona:

1. Si la URL trae `?tema=` (lo pone el "Sufijo de URL final" de cada grupo de
   anuncios en Google Ads), manda ese.
2. Si no, mira la `utm_term` (la palabra clave buscada) y la compara con cada
   tema en orden.
3. Si nada coincide, se ve la versión original.

Temas: `competencia`, `facturacion`, `stock`, `precios`, `ventas`, `gestion`.
Los textos y las palabras que reconoce cada uno están en el bloque
`var TEMAS = [...]`, casi al final de
`sistema-gestion-casas-de-repuestos.html`. Se puede cambiar el título (`t`) o
la bajada (`l`) de un tema; **no cambiar el `id`**, porque es lo que está
puesto en los grupos de anuncios.

Para probar: `https://boxergestion.com/sistema-gestion-casas-de-repuestos?tema=stock`.
Google indexa la versión sin parámetros (el `canonical` no lleva `?tema=`).

## ⚠️ Lo que NO hay que tocar

Si algo de esto cambia, los leads pueden dejar de entrar al CRM **sin que nadie
se entere**. Ante la duda, preguntarle a Joana antes.

1. **El token de los formularios.** Es la clave con la que n8n acepta el envío:
   - demos (home, módulos, planes, asesoría): `boxer-home-2026`
   - curso de IA (comunidad): `boxer-clases-ia-2026`
   - landing de Ads: `boxer-landing-casas-de-repuestos-2026`

   Son públicos (cualquiera los ve en el código de la página), no son secretos,
   pero n8n descarta lo que no llegue con el valor exacto.
2. **Los `name` de los campos** (`nombre`, `negocio`, `tipo`, `tel`, `telefono`,
   `utm_*`, `gclid`, `formulario`, etc.) y los campos ocultos. n8n los lee por
   nombre. `tipo`/`tipo_negocio` y `tel`/`telefono` van duplicados a propósito.
3. **Las URLs de los webhooks** de n8n (`.../webhook/home-boxer`,
   `clases-ia-boxer`, `landing-alta-intencion`, `boxer-cerac`).
4. **Los `value` del select de tipo de negocio.** Lo que se ve se puede cambiar;
   el `value` no: n8n lo busca por texto exacto para asignar el rubro en Bitrix,
   y si no coincide lo manda a "A definir" sin avisar (ya pasó: 21/09 al 01/10).
   - Home, módulos, planes, asesoría: `Casa de repuestos`, `Taller Mecánico`,
     `Lubricentro`, `Otro`.
   - Landing de Ads: `Casa de repuestos de autos`, `... de motos`,
     `... agrícolas`, `... pesados`, `Distribuidora mayorista`.

   Sumar una opción nueva requiere sumarla también en n8n.
5. **El atributo `data-formulario`** (`home-demo`, `planes-demo`,
   `asesoria-demo`, ...). Los que terminan en `-demo` disparan la conversión de
   Google Ads y el Lead de Meta; el informe semanal separa los leads por ese
   valor.
6. **`assets/google-ads.js` y `assets/meta-pixel.js`**, y las líneas que los
   cargan en el `<head>` de cada página. Son la conversión de Google Ads
   (`AW-432396317`, cuenta 353-792-1854) y el píxel de Meta. Si se borran, las
   campañas dejan de ver los leads.
7. **El guardado de UTM en `sessionStorage` dentro de `assets/boxer.js`.** Es lo
   que hace que un lead que entró por un anuncio a la home y completó el
   formulario en Planes llegue con su canal.
8. **El `<noscript>` que fuerza las secciones visibles.** Sin él, si el JS no
   carga, la página queda en blanco.

Textos, imágenes, colores y secciones nuevas se pueden cambiar con
tranquilidad.

## Cómo editar desde GitHub

**Un cambio chico (un texto, un precio):**
1. Entrar al archivo en github.com/joanavillarreal/boxer-gestion-web.
2. Tocar el lápiz ("Edit this file").
3. Cambiar el texto. Con `Ctrl+F` del navegador se encuentra rápido.
4. "Commit changes…", escribir qué se cambió, dejar marcado "Commit directly
   to the main branch" y confirmar.
5. En uno o dos minutos está publicado. Revisarlo en la web.

**Cambiar una imagen:** entrar a la carpeta (`assets/`, `uploads/`), "Add file"
→ "Upload files", subirla **con el mismo nombre** que la que reemplaza y
confirmar. Si tiene otro nombre, hay que cambiar también el HTML que la usa.

**Un cambio grande (una versión nueva del diseño):** mejor pedírselo al agente
en una sesión de Claude Code con este repo sumado. Las páginas principales
salen del export del equipo de diseño con `scripts/construir_web.py` del repo
del agente, que agrega SEO, saca el runtime de edición y deja los formularios
conectados:

```bash
python3 scripts/construir_web.py <carpeta-del-export> --salida ../boxer-gestion-web
```

El script **no genera** `asesoria.html`, `sistema-gestion-casas-de-repuestos.html`
ni `cerac-locro-2026.html`: esas se editan a mano. Si el equipo cambia los
textos de la comparativa de planes o de las preguntas frecuentes, están en el
script (`GRUPOS_PLANES` y `FAQS`).

**Si algo sale mal:** en Netlify → Deploys, elegir el deploy anterior que andaba
y "Publish deploy". Vuelve al instante. Después se corrige el archivo en GitHub
con calma.

**Previsualizar en la compu:** `python3 -m http.server 8000` en la carpeta del
repo y abrir http://localhost:8000.

## Cosas para saber

- **Canonical sin extensión:** apuntan a `/modulos`, `/planes`, etc. Los links
  internos usan `.html`; Netlify responde las dos formas.
- **El `title` y la `description` de la home** son los que tenía la web vieja, a
  propósito: cambiarlos tira el posicionamiento ganado.
- **No hay GA4 ni Tag Manager.** `boxer.js` ya hace
  `dataLayer.push({event:'lead_formulario'})` en cada envío, listo para cuando
  se instale.
- **`cerac-locro-2026.html`** tiene un select con `value="Taller"` y postea a
  otro webhook (`boxer-cerac`). No se revisó contra n8n: si se vuelve a usar,
  mirar ese flujo antes.
- **Nunca subir acá** exports de n8n ni URLs de Bitrix: llevan tokens en la ruta.
