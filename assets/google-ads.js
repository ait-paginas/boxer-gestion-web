/*
 * Etiqueta de Google Ads de Boxer Gestion (sin Tag Manager).
 *
 * Completar ID y ETIQUETA con los datos de la accion de conversion
 * "Lead formulario web" (Google Ads -> Objetivos -> Conversiones -> la accion ->
 * Configuracion de la etiqueta -> "Instalar la etiqueta tu mismo": el fragmento
 * de evento trae send_to: 'AW-XXXXXXXXX/YYYYYYYYYYY'. ID = la parte antes de la
 * barra, ETIQUETA = la parte despues).
 *
 * Mientras ID este vacio, este archivo no carga nada: se puede subir al hosting
 * sin efecto. Cambiar el ID = editar solo este archivo.
 *
 * Que hace cuando tiene ID:
 *  - carga gtag.js en todas las paginas (medicion + listas de remarketing +
 *    guarda el gclid del anuncio en una cookie propia);
 *  - deja lista la conversion para boxer.js, que la dispara SOLO cuando un
 *    formulario de demo (home, modulos, planes) se envia bien. El formulario
 *    del curso de IA de Comunidad NO cuenta (decision de Joana, 2026-09-23).
 */
(function () {
  var ID = 'AW-432396317';            // cuenta 353-792-1854 (AIT Solutions)
  var ETIQUETA = '3IJmCIq1j4QdEJ2wl84B'; // accion 'Lead formulario web' (id 7793269386)

  if (!ID) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ID);
  if (ETIQUETA) window.BOXER_CONVERSION = ID + '/' + ETIQUETA;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
  document.head.appendChild(s);
})();
