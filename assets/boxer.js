/* Boxer Gestión — interactividad del sitio público.
 *
 * Reemplaza al runtime de autoría del equipo de diseño (support.js, que baja
 * React + ReactDOM + Babel de unpkg y compila en el navegador). Acá no hay
 * dependencias: el HTML ya viene armado y esto solo le agrega comportamiento.
 *
 * Generado desde el export por scripts/construir_web.py — ver web/README.md.
 */
(function () {
  'use strict';

  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var $$ = function (sel, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(sel));
  };
  var menosMovimiento = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mostrar(el, visible) {
    if (!el) return;
    el.style.display = visible ? 'contents' : 'none';
  }

  /* ---------- menú mobile ---------- */
  function menu() {
    var boton = $('[data-accion="toggleMenu"]');
    var panel = $('[data-si="menuOpen"]');
    if (!boton || !panel) return;
    var icono = $('.material-icons', boton);
    var abierto = false;
    mostrar(panel, false);
    boton.setAttribute('aria-expanded', 'false');
    boton.addEventListener('click', function () {
      abierto = !abierto;
      mostrar(panel, abierto);
      boton.setAttribute('aria-expanded', String(abierto));
      if (icono) icono.textContent = abierto ? 'close' : 'menu';
    });
    // Navegar dentro del panel lo cierra.
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        abierto = false;
        mostrar(panel, false);
        boton.setAttribute('aria-expanded', 'false');
        if (icono) icono.textContent = 'menu';
      }
    });
  }

  /* ---------- aparecer al hacer scroll ---------- */
  function revelar() {
    var nodos = $$('[data-reveal]');
    if (menosMovimiento || !('IntersectionObserver' in window)) {
      nodos.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      contadores();
      return;
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.opacity = '1';
        e.target.style.transform = 'none';
        if (e.target.hasAttribute('data-counter')) contadores();
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    nodos.forEach(function (el) { io.observe(el); });
  }

  /* ---------- contadores ---------- */
  var contado = false;
  function contadores() {
    if (contado) return;
    contado = true;
    var nodos = $$('[data-contador]');
    if (!nodos.length) return;
    if (menosMovimiento) return; // ya muestran el valor final en el HTML
    var objetivos = nodos.map(function (el) { return parseInt(el.dataset.contador, 10) || 0; });
    var t0 = performance.now(), dur = 1700;
    function paso(ahora) {
      var p = Math.min(1, (ahora - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      nodos.forEach(function (el, i) {
        el.textContent = Math.round(objetivos[i] * e).toLocaleString('es-AR');
      });
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  /* ---------- botones que siguen al mouse ---------- */
  function iman() {
    if (menosMovimiento) return;
    var actual = null;
    document.addEventListener('mousemove', function (e) {
      var el = e.target.closest ? e.target.closest('[data-magnet]') : null;
      if (actual && actual !== el) { actual.style.transform = ''; actual = null; }
      if (!el) return;
      actual = el;
      var r = el.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
      var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
      el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    });
  }

  /* ---------- palabra que rota en el hero ---------- */
  function palabraRotativa() {
    var el = $('[data-rotword]');
    if (!el || menosMovimiento) return;
    var palabras = ['repuestera.', 'taller.', 'lubricentro.', 'stock.', 'listas.',
                    'facturación.', 'Mercado Libre.'];
    var i = 0;
    setInterval(function () {
      i = (i + 1) % palabras.length;
      var nuevo = el.cloneNode(false);
      nuevo.textContent = palabras[i];
      nuevo.style.animation = 'bxWordIn .7s cubic-bezier(.2,.7,.2,1) both';
      el.parentNode.replaceChild(nuevo, el);
      el = nuevo;
    }, 2400);
  }

  /* ---------- carruseles ---------- */
  function carruseles() {
    var mapa = { planesPrev: ['planes', -1], planesNext: ['planes', 1],
                 intPrev: ['int', -1], intNext: ['int', 1],
                 videosPrev: ['videos', -1], videosNext: ['videos', 1] };
    Object.keys(mapa).forEach(function (accion) {
      $$('[data-accion="' + accion + '"]').forEach(function (boton) {
        var nombre = mapa[accion][0], dir = mapa[accion][1];
        boton.addEventListener('click', function () {
          var pista = $('[data-carousel="' + nombre + '"]');
          if (pista) pista.scrollBy({ left: dir * pista.clientWidth * 0.82, behavior: 'smooth' });
        });
      });
    });
  }

  /* ---------- preguntas frecuentes ---------- */
  function faq() {
    var botones = $$('[data-faq]');
    if (!botones.length) return;
    botones.forEach(function (boton) {
      boton.addEventListener('click', function () {
        var i = boton.dataset.faq;
        var panel = $('[data-faq-panel="' + i + '"]');
        var abierto = panel && !panel.hidden;
        // Acordeón: se cierra todo y se abre el que corresponda.
        botones.forEach(function (b) {
          var p = $('[data-faq-panel="' + b.dataset.faq + '"]');
          if (p) p.hidden = true;
          b.setAttribute('aria-expanded', 'false');
          var ic = $('.material-icons', b);
          if (ic) ic.style.transform = 'none';
        });
        if (panel && !abierto) {
          panel.hidden = false;
          panel.style.animation = 'bxFadeUp .3s ease-out both';
          boton.setAttribute('aria-expanded', 'true');
          var ic = $('.material-icons', boton);
          if (ic) ic.style.transform = 'rotate(180deg)';
        }
      });
    });
  }

  /* ---------- atribución ---------- */
  /* El sitio son cuatro páginas reales, no una sola con #hash como la versión
   * anterior: al navegar de la home a Planes se pierde el query string, y con
   * él los utm_* del anuncio. Por eso se guardan en sessionStorage la primera
   * vez y se reusan en cualquier formulario de la sesión. Sin esto, todo lead
   * que no complete el formulario de la página de aterrizaje llega sin canal.
   */
  var UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'fbclid'];
  var CLAVE = 'bx_atribucion';

  function atribucion() {
    var params = new URLSearchParams(window.location.search);
    var deLaUrl = {};
    var hayAlguno = false;
    UTMS.concat(CLICK_IDS).forEach(function (k) {
      var v = params.get(k);
      if (v) { deLaUrl[k] = v; hayAlguno = true; }
    });

    // La URL manda: si el visitante vuelve a entrar por otro anuncio, esa
    // visita es la que cuenta.
    if (hayAlguno) {
      deLaUrl.aterrizaje = window.location.pathname;
      deLaUrl.referrer_inicial = document.referrer || '';
      try { sessionStorage.setItem(CLAVE, JSON.stringify(deLaUrl)); } catch (e) { /* modo privado */ }
      return deLaUrl;
    }
    try {
      return JSON.parse(sessionStorage.getItem(CLAVE) || '{}');
    } catch (e) {
      return {};
    }
  }

  /* ---------- formularios -> n8n ---------- */
  function llenarAtribucion(form) {
    var datos = atribucion();
    UTMS.forEach(function (u) {
      var campo = form.elements[u];
      if (campo) campo.value = datos[u] || '';
    });
    // token = la clave que valida el flujo de n8n (la misma que manda la web
    // actual en los formularios de demo). formulario = cual de los cuatro fue.
    if (form.elements.token) form.elements.token.value = form.dataset.token || '';
    if (form.elements.formulario) {
      form.elements.formulario.value = form.dataset.formulario || '';
    }
    if (form.elements.pagina) form.elements.pagina.value = window.location.pathname;
    if (form.elements.referrer) {
      form.elements.referrer.value = datos.referrer_inicial || document.referrer || '';
    }
    CLICK_IDS.forEach(function (k) {
      var campo = form.elements[k];
      if (campo) campo.value = datos[k] || '';
    });
    if (form.elements.aterrizaje) {
      form.elements.aterrizaje.value = datos.aterrizaje || window.location.pathname;
    }
  }

  function formularios() {
    $$('[data-bxform]').forEach(function (form) {
      var tarjeta = form.parentNode;
      var exito = $('[data-si="enviado"]', tarjeta) || $('[data-si="enviado"]', form);
      var pedido = $('[data-si="noEnviado"]', form) || $('[data-si="noEnviado"]', tarjeta);
      var cajaError = $('[data-si="hayError"]', form);
      var error = $('[data-error]', form);
      var boton = $('button[type="submit"]', form);
      var textoBoton = boton ? boton.innerHTML : '';

      mostrar(exito, false);
      mostrar(pedido, true);
      mostrar(cajaError, false);
      llenarAtribucion(form);

      function fallar(msg) {
        if (error) error.textContent = msg;
        mostrar(cajaError, true);
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        mostrar(cajaError, false);

        var datos = {};
        UTMS.concat(CLICK_IDS, ['nombre', 'negocio', 'tipo', 'tel', 'ia',
                                'token', 'formulario', 'pagina', 'referrer',
                                'aterrizaje'])
          .forEach(function (k) {
            var campo = form.elements[k];
            if (campo) datos[k] = (campo.value || '').trim();
          });

        // Mismos nombres que espera el flujo actual de n8n.
        datos.telefono = datos.tel;
        datos.tipo_negocio = datos.tipo;

        var obligatorios = ['nombre', 'negocio', 'tipo', 'tel'];
        if (form.elements.ia) obligatorios.push('ia');
        var falta = obligatorios.some(function (k) { return !datos[k]; });
        if (falta) {
          fallar(form.elements.ia
            ? 'Completá todos los campos para anotarte.'
            : 'Completá nombre, negocio, tipo y teléfono.');
          return;
        }
        if (datos.tel.replace(/\D/g, '').length < 8) {
          fallar('Revisá el teléfono: falta el código de área.');
          return;
        }

        if (boton) { boton.disabled = true; boton.innerHTML = 'Enviando…'; }

        fetch(form.dataset.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        }).then(function (res) {
          if (!res.ok) throw new Error('estado ' + res.status);
          mostrar(pedido, false);
          mostrar(exito, true);
          if (window.dataLayer) {
            window.dataLayer.push({
              event: 'lead_formulario', formulario: datos.formulario
            });
          }
          // Conversion de Google Ads (assets/google-ads.js). Solo demos: el
          // formulario del curso de IA de Comunidad no es un lead de venta.
          if (window.gtag && window.BOXER_CONVERSION &&
              /-demo$/.test(datos.formulario || '')) {
            window.gtag('event', 'conversion', { send_to: window.BOXER_CONVERSION });
          }
          // Pixel de Meta (assets/meta-pixel.js): Lead solo para demos; el curso
          // de IA va como evento propio, para audiencias.
          if (window.fbq) {
            if (/-demo$/.test(datos.formulario || '')) {
              window.fbq('track', 'Lead', { content_name: datos.formulario });
            } else if (datos.formulario === 'comunidad-clases-ia') {
              window.fbq('trackCustom', 'InscripcionClasesIA');
            }
          }
        }).catch(function () {
          fallar('No pudimos enviar el formulario. Probá de nuevo o escribinos por WhatsApp.');
        }).then(function () {
          if (boton) { boton.disabled = false; boton.innerHTML = textoBoton; }
        });
      });

      var reset = $('[data-accion="reset"]', tarjeta) || $('[data-accion="reset"]', form);
      if (reset) {
        reset.addEventListener('click', function () {
          form.reset();
          llenarAtribucion(form);
          mostrar(exito, false);
          mostrar(pedido, true);
          mostrar(cajaError, false);
        });
      }
    });
  }

  /* ---------- demo de Boxer + Claude ---------- */
  function chat() {
    var feed = $('[data-chat-feed]');
    if (!feed) return;

    var guion = [
      { k: 'user', text: 'Usá el conector de Boxer y decime cuántos clientes tienen comprobantes a vencer esta semana.' },
      { k: 'dots', ms: 1500 },
      { k: 'ai', text: 'Tenés 7 clientes con comprobantes a vencer entre el 21 y el 27/09, por $ 1.284.300,00 en total. Los cinco más pesados: Frenos Valdivieso $ 412.500,00 (vence 22/09), Lubricentro Katari $ 268.900,00 (23/09), Autopartes Zuriaga $ 214.300,00 (24/09), Taller Nakamura $ 186.400,00 (25/09) y Repuestos Olmedilla $ 102.200,00 (26/09).', chips: ['Ver los 7 clientes', 'Abrir cuenta corriente'] },
      { k: 'user', text: 'Armame un mensaje para copiar y pegar para enviarle a los deudores.' },
      { k: 'dots', ms: 1600 },
      { k: 'ai', text: 'Listo, con los datos de cada cuenta: «Hola [Nombre], te escribimos de [Tu negocio]. Te recordamos que tenés un comprobante de $ [Importe] con vencimiento el [Fecha]. Si ya lo abonaste, avisanos y lo imputamos. ¡Gracias!» Cambio los corchetes por los datos reales de cada cliente al exportar.', chips: ['Exportar los 7 mensajes', 'Cambiar el tono'] },
      { k: 'wait', ms: 4000 }
    ];

    var ESTILO = {
      user: 'align-self:flex-end;max-width:82%;background:#18163D;color:#fff;border-radius:16px 16px 4px 16px;padding:12px 16px;font-size:14px;line-height:1.5',
      ai: 'align-self:flex-start;max-width:88%;background:#fff;color:#2E2C5C;border:1px solid #ECECF1;border-radius:16px 16px 16px 4px;padding:12px 16px;font-size:14px;line-height:1.55',
      dots: 'align-self:flex-start;background:#fff;border:1px solid #ECECF1;border-radius:999px;padding:12px 18px;display:flex;gap:5px',
      chips: 'display:flex;flex-wrap:wrap;gap:8px;margin-top:10px',
      chip: 'background:#F4F4F7;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;color:#2E2C5C'
    };

    function burbuja(tipo) {
      var el = document.createElement('div');
      el.setAttribute('style', ESTILO[tipo]);
      feed.appendChild(el);
      feed.scrollTop = feed.scrollHeight;
      return el;
    }

    if (menosMovimiento) {
      // Sin animación: se muestra la conversación completa de una.
      guion.forEach(function (p) {
        if (p.k !== 'user' && p.k !== 'ai') return;
        var el = burbuja(p.k);
        el.textContent = p.text;
        if (p.chips) {
          var cont = document.createElement('div');
          cont.setAttribute('style', ESTILO.chips);
          p.chips.forEach(function (c) {
            var s = document.createElement('span');
            s.setAttribute('style', ESTILO.chip);
            s.textContent = c;
            cont.appendChild(s);
          });
          el.appendChild(cont);
        }
      });
      return;
    }

    var esperar = function (ms) {
      return new Promise(function (r) { setTimeout(r, ms); });
    };
    var tipear = function (el, texto, ms) {
      return texto.split('').reduce(function (p, _, i) {
        return p.then(function () {
          el.textContent = texto.slice(0, i + 1);
          feed.scrollTop = feed.scrollHeight;
          return esperar(ms);
        });
      }, Promise.resolve());
    };

    var visible = true;
    if ('IntersectionObserver' in window) {
      visible = false;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { visible = true; io.disconnect(); correr(); }
        });
      }, { threshold: 0.2 });
      io.observe(feed);
    }

    var corriendo = false;
    function correr() {
      if (corriendo || !visible) return;
      corriendo = true;
      var i = 0;
      function siguiente() {
        var p = guion[i];
        i = (i + 1) % guion.length;
        var paso;
        if (p.k === 'user') {
          var eu = burbuja('user');
          paso = tipear(eu, p.text, 38).then(function () { return esperar(500); });
        } else if (p.k === 'dots') {
          var ed = burbuja('dots');
          ed.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#BFBECE;animation:bxPulse 1.2s infinite"></span>'
            + '<span style="width:6px;height:6px;border-radius:50%;background:#BFBECE;animation:bxPulse 1.2s .2s infinite"></span>'
            + '<span style="width:6px;height:6px;border-radius:50%;background:#BFBECE;animation:bxPulse 1.2s .4s infinite"></span>';
          paso = esperar(p.ms).then(function () { ed.remove(); });
        } else if (p.k === 'ai') {
          var ea = burbuja('ai');
          paso = tipear(ea, p.text, 14).then(function () {
            if (!p.chips) return;
            var cont = document.createElement('div');
            cont.setAttribute('style', ESTILO.chips);
            p.chips.forEach(function (c) {
              var s = document.createElement('span');
              s.setAttribute('style', ESTILO.chip);
              s.textContent = c;
              cont.appendChild(s);
            });
            ea.appendChild(cont);
            feed.scrollTop = feed.scrollHeight;
          }).then(function () { return esperar(1400); });
        } else {
          paso = esperar(p.ms).then(function () { feed.innerHTML = ''; });
        }
        paso.then(siguiente);
      }
      siguiente();
    }
    if (visible) correr();
  }

  function iniciar() {
    // La atribucion se guarda SIEMPRE al aterrizar, tenga o no formulario esta
    // pagina. Antes solo corria desde formularios(): si alguien entra por un
    // anuncio a una pagina sin formulario y despues navega a una que si lo
    // tiene, el utm_* y el gclid ya se habian perdido.
    atribucion();
    menu();
    revelar();
    iman();
    palabraRotativa();
    carruseles();
    faq();
    formularios();
    chat();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
