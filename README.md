# Web de Boxer Gestión — boxergestion.com

Este repo **es** la web: lo que está en `main` es lo que Netlify publica en
boxergestion.com. HTML estático, sin paso de build. Cada commit a `main` sale
publicado en uno o dos minutos, por eso **los cambios se hacen en una rama y se
revisan en la vista previa antes de pasar a `main`** (ver "Cómo trabajar en
equipo").

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

## Cómo trabajar en equipo

**Regla única: nada llega a `main` sin haberse visto antes en una vista previa.**
`main` es la web publicada; todo lo demás es borrador. Cualquiera del equipo
puede hacer cambios y publicarlos: no hace falta que otra persona apruebe, sí
que quien hace el cambio lo haya revisado en la vista previa.

```
rama (borrador)  ──►  vista previa en Netlify  ──►  checklist OK  ──►  merge a main  ──►  publicado
```

### 1. Hacer el cambio en una rama

Desde github.com, en cualquier archivo:
1. Tocar el lápiz ("Edit this file") y hacer el cambio.
2. En "Commit changes…" elegir **"Create a new branch for this commit"** y
   ponerle un nombre corto que diga qué es: `precio-plan-pro`, `fotos-home`.
3. Si hay más cambios, seguir editando **en esa misma rama** (arriba a la
   izquierda, el selector de rama tiene que mostrar ese nombre, no `main`).

Nunca elegir "Commit directly to the main branch": eso publica al instante,
sin vista previa.

### 2. Mirar la vista previa

Netlify publica cada rama en su propia dirección, sin tocar la web real:

`https://NOMBRE-DE-LA-RAMA--NOMBRE-DEL-SITIO.netlify.app`

(el nombre del sitio es el de Netlify, el que aparece en Site configuration).
Tarda uno o dos minutos después de cada commit. También se ve en Netlify →
Deploys, filtrando por rama.

### 3. Checklist antes de publicar

En la vista previa, en compu **y** en celular:

- [ ] La página que cambié se ve bien y dice lo que tiene que decir.
- [ ] Menú y links llevan a donde tienen que llevar.
- [ ] Las imágenes cargan (ninguna rota).
- [ ] Si toqué una página con formulario: lo envié con nombre **PRUEBA** y
      apareció el mensaje de enviado. (Crea un prospecto real en Bitrix:
      avisar para que lo descarten.)
- [ ] No toqué nada de la lista de "Lo que NO hay que tocar", o si lo toqué,
      Joana lo sabe.

### 4. Publicar (merge a main)

En GitHub el botón de merge vive en un "Pull Request", y se usa solo como
botón: lo abre y lo mergea la misma persona que hizo el cambio.

1. En la página del repo aparece un aviso amarillo "NOMBRE had recent pushes"
   con el botón **"Compare & pull request"**. Tocarlo.
2. En la descripción, pegar el link de la vista previa y marcar el checklist.
3. "Create pull request" y después **"Merge pull request"** → "Confirm merge".
4. "Delete branch" para no acumular ramas viejas.
5. En uno o dos minutos está en boxergestion.com. Mirarlo una vez más ahí.

### Si algo sale mal

En Netlify → Deploys, elegir el deploy anterior que andaba y **"Publish
deploy"**. Vuelve al instante. Después se corrige en una rama, con calma.

### Sumar a alguien al equipo

- **GitHub:** Settings → Collaborators → Add people (usuario de GitHub o mail).
  La persona acepta la invitación desde su mail.
- **Netlify:** si un deploy de esa persona aparece bloqueado por "Git
  contributor", sumarla en Netlify → Team → Members.
- Pasarle este README: sobre todo "Lo que NO hay que tocar" y este checklist.

### Configuración de Netlify que hace falta (una sola vez)

Site configuration → Build & deploy → Continuous deployment → **Branches and
deploy contexts**:
- Production branch: `main`
- **Branch deploys: All** (es lo que da la vista previa de cada rama)
- Deploy Previews: activado

## Sumar una página nueva

Cada archivo `.html` en la raíz es una página: `promo-octubre.html` se ve en
`boxergestion.com/promo-octubre`. Para una landing nueva:

1. **Partir de una que se parezca**: copiar `asesoria.html` (landing de campaña,
   sin menú) o `sistema-gestion-casas-de-repuestos.html` (landing de Ads con
   videos y preguntas) con el nombre nuevo. Así ya trae estilos, píxel de
   Meta, conversión de Google Ads y el formulario funcionando.
2. Cambiar `title`, `description`, `canonical` y las etiquetas `og:` del
   `<head>` con los datos de la página nueva.
3. **El formulario:** dejar `token`, nombres de campos y webhook como están;
   cambiar solo `data-formulario` por un nombre propio terminado en `-demo`
   (ej. `promo-octubre-demo`), así cuenta como conversión y el informe
   semanal la separa. Si va a otro webhook o pide campos nuevos, hay que
   tocar n8n antes: hablarlo con Joana.
4. **¿Tiene que aparecer en Google?** Si es una landing de campaña, no:
   dejar `<meta name="robots" content="noindex, follow">` como en `asesoria.html`.
   Si es una página permanente, sí: sacar el `noindex` y sumarla a
   `sitemap.xml`.
5. Imágenes nuevas en `uploads/`.
6. Seguir el mismo camino de siempre: rama, vista previa, checklist, merge.

Claude puede hacer todo esto: en una sesión de Claude Code, pedirle que sume el
repo `joanavillarreal/boxer-gestion-web` y describirle la página. Que trabaje
en una rama y pase el link de la vista previa; el merge lo hace una persona
después de revisarla.

### Cambio grande: versión nueva del diseño

Las páginas principales (home, módulos, planes, comunidad) salen del export
del equipo de diseño con `scripts/construir_web.py` del repo del agente
(`joanavillarreal/agente-ga-web`), que agrega SEO, saca el runtime de edición
y deja los formularios conectados. Mejor pedírselo a Claude:

```bash
python3 scripts/construir_web.py <carpeta-del-export> --salida ../boxer-gestion-web
```

El script **no genera** `asesoria.html`, `sistema-gestion-casas-de-repuestos.html`
ni `cerac-locro-2026.html`: esas se editan a mano. Si el equipo cambia los
textos de la comparativa de planes o de las preguntas frecuentes, están en el
script (`GRUPOS_PLANES` y `FAQS`).

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
