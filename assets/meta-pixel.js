/*
 * Pixel de Meta de Boxer Gestion (sin Tag Manager).
 *
 * ID = "Facebook Pixel - Boxer" (1084727415780829), del business AIT. Es el pixel
 * que ya existia: dejo de recibir datos en oct-2025 con el cambio de web y se
 * reusa para no perder historial ni audiencias.
 *
 * Que hace:
 *  - PageView en todas las paginas (audiencias de visitantes para remarketing);
 *  - boxer.js manda "Lead" cuando se envia bien un formulario de DEMO, y el
 *    evento personalizado "InscripcionClasesIA" cuando es el del curso de IA
 *    (sirve para audiencias; no es un lead de venta).
 * Vaciar ID desactiva todo.
 */
(function () {
  var ID = '1084727415780829';
  if (!ID) return;

  /* Codigo base oficial de Meta (fbevents.js), sin cambios de logica. */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', ID);
  window.fbq('track', 'PageView');
})();
