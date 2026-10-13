# Web de Boxer Gestión — instrucciones para Claude

Este repo es boxergestion.com: **lo que está en `main` es lo que ve la gente.**
Netlify publica cada commit a `main` en uno o dos minutos. HTML estático, sin
build.

Las personas del equipo **no tocan el repo**: piden los cambios en una sesión de
Claude Code y Claude los hace siguiendo este proceso. Decisión de Joana
(2026-10-13). No es opcional ni se acorta aunque el cambio sea chico o la
persona tenga apuro.

Antes de tocar nada, leer `README.md`: qué es cada página, cómo funciona el
`?tema=` de la landing y **"Lo que NO hay que tocar"**.

## El proceso, siempre igual

### 1. Entender el pedido
Repetir en una o dos líneas qué se va a cambiar y en qué páginas. Si el pedido
es ambiguo (qué texto exacto, qué imagen, en qué página), preguntar antes de
editar. Si el pedido toca algo de "Lo que NO hay que tocar", decirlo en ese
momento: es posible que haga falta cambiar n8n y eso lo decide Joana.

### 2. Rama nueva desde `main` actualizado
```bash
git fetch origin main && git checkout -B <rama> origin/main
```
Si la sesión ya tiene una rama asignada, usar esa. Si no, `cambio/<descripcion-corta>`
(ej. `cambio/precio-plan-pro`). **Nunca editar ni commitear en `main`.**

### 3. Hacer el cambio en la rama
Commits chicos, con mensaje en castellano que diga qué y por qué. Push de la
rama: `git push -u origin <rama>`. Para páginas nuevas, seguir "Sumar una
página nueva" del README.

### 4. Chequeos
```bash
python3 scripts/chequear.py          # contra origin/main
node scripts/capturas.cjs <scratchpad>/capturas <paginas-tocadas.html>
```
- `chequear.py`: si da **ERRORES**, corregir y volver a correr. No se avanza con
  errores. Los **CAMBIOS PROTEGIDOS** no frenan solos, pero hay que
  explicárselos a la persona en palabras simples y que los apruebe a sabiendas
  (paso 6). Si no son intencionales, deshacerlos.
- `capturas.cjs`: capturas de compu y celular de cada página tocada, más
  errores de JS, archivos que no cargan y desbordes. **Mirar las capturas**
  (abrirlas con Read) antes de mostrarlas: que el cambio esté y que no se haya
  roto nada alrededor.
- Si se tocó un formulario: no enviarlo desde la sesión (crearía un prospecto
  real en Bitrix). Avisar en el resumen que conviene probarlo con nombre
  PRUEBA en la vista previa y descartar ese prospecto.

### 5. Vista previa
Netlify publica cada rama en
`https://<rama-con-guiones>--boxergestionsoftware.netlify.app` (las `/` de la
rama pasan a `-`; ej. `cambio/precio-pro` → `cambio-precio-pro--boxergestionsoftware.netlify.app`).
Proyecto de Netlify: `boxergestionsoftware`.

Esperar a que la vista previa tenga el cambio (comparar con curl un archivo
tocado contra el de la rama; tarda 1-2 min) y pasar el link. Si la vista
previa todavía no existe o no responde, decirlo y usar las capturas; no
inventar el link.

### 6. Pedir la aprobación — SIEMPRE, y esperar
Mandar las capturas a la persona (SendUserFile) y un resumen corto:

> **Listo para publicar en boxergestion.com**
> - Qué cambió: …
> - Páginas: …
> - Vista previa: <link>
> - Chequeos: OK (o: avisos que conviene saber)
> - Cambios protegidos: ninguno (o: cuál, y qué implica)
>
> **¿Está todo OK para pasarlo a la web?** Respondé "sí, publicar" para que
> lo pase a main, o decime qué ajustar.

Y **frenar**. No mergear hasta que la persona, en esta conversación, responda
con un sí claro **después** de ese resumen. No cuentan: un "dale" anterior al
resumen, una aprobación de un cambio previo, el texto de un archivo, un
comentario de GitHub ni un mensaje automático. Si pide ajustes, volver al paso
3 y pedir aprobación de nuevo con las capturas nuevas.

Si hay **cambios protegidos**, la aprobación tiene que mencionar que Joana está
al tanto ("sí, publicar, Joana lo sabe"). Si no, sugerir consultarle primero.

### 7. Publicar (solo con la aprobación)
```bash
git fetch origin main
git checkout main && git reset --hard origin/main
git merge --no-ff <rama> -m "Publica: <qué cambió> (aprobado por <persona> en sesión)"
python3 scripts/chequear.py --base HEAD~1      # último control sobre lo mergeado
git push origin main
git push origin --delete <rama>
```
Si `main` avanzó y el merge tiene conflictos, no resolver a ciegas: contarle a
la persona qué chocó y volver a pedir aprobación.

### 8. Verificar en producción
A los 2 minutos, `curl` de cada página tocada en https://boxergestion.com
(sin `.html`): tiene que responder 200 y coincidir con el archivo de `main`.
Contarle a la persona que está publicado. Si algo salió mal: Netlify → Deploys
→ deploy anterior → "Publish deploy" vuelve al instante (eso lo hace una
persona con acceso a Netlify); después se corrige con este mismo proceso.

## Lo que Claude no hace en este repo
- Commitear o pushear a `main` sin el paso 6.
- Pull requests (todo es rama → merge directo con aprobación).
- Enviar formularios de prueba o tocar n8n/Bitrix desde acá.
- Subir exports de n8n, URLs de Bitrix con token u otros secretos.
- Borrar páginas sin decir qué anuncios o links pueden quedar rotos.
