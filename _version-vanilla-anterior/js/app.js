/* ═══════════════════════════════════════════════════════════
   MovilDrink · app.js
   Arranque, navegación entre vistas, eventos globales,
   tema claro/oscuro y registro del service worker.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var store = MD.store;
  var ui = MD.ui;
  var checkout = MD.checkout;
  var admin = MD.admin;
  var $ = MD.$;

  var app = { vista: 'catalogo' };

  /* ═══════════════ Tema ═══════════════ */

  var TEMA_KEY = 'movildrink.tema';

  function aplicarTema(t) {
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0b1220' : '#0d9488');
  }

  function iniciarTema() {
    var guardado;
    try { guardado = localStorage.getItem(TEMA_KEY); } catch (e) {}
    if (guardado) {
      aplicarTema(guardado);
    } else {
      var oscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      aplicarTema(oscuro ? 'dark' : 'light');
    }
  }

  function alternarTema() {
    var actual = document.documentElement.getAttribute('data-theme');
    var nuevo = actual === 'dark' ? 'light' : 'dark';
    aplicarTema(nuevo);
    try { localStorage.setItem(TEMA_KEY, nuevo); } catch (e) {}
  }

  /* ═══════════════ Navegación ═══════════════ */

  var VISTAS = ['catalogo', 'pedidos', 'admin'];

  app.irA = function (vista, sinHash) {
    if (VISTAS.indexOf(vista) === -1) vista = 'catalogo';

    // El panel exige PIN antes de mostrarse.
    if (vista === 'admin' && !admin.desbloqueado) {
      app.mostrar('catalogo');
      admin.pedirPin();
      return;
    }

    app.mostrar(vista);
    if (!sinHash) {
      var h = '#/' + vista;
      if (location.hash !== h) history.pushState(null, '', h);
    }
  };

  app.mostrar = function (vista) {
    app.vista = vista;
    VISTAS.forEach(function (v) {
      var el = $('#view-' + v);
      if (el) el.hidden = v !== vista;
    });

    // La búsqueda y las categorías sólo tienen sentido en el catálogo.
    var esCatalogo = vista === 'catalogo';
    $('#chips').hidden = !esCatalogo;
    document.querySelector('.topbar__row--search').hidden = !esCatalogo;

    if (vista === 'pedidos') ui.renderPedidos();
    if (vista === 'admin') admin.render();

    window.scrollTo({ top: 0, behavior: 'auto' });
    medirHeader();
  };

  function desdeHash() {
    var v = (location.hash || '').replace(/^#\/?/, '') || 'catalogo';
    app.irA(v, true);
  }

  /* ═══════════════ Altura del encabezado ═══════════════ */

  /* El carrito fijo en laptop se posiciona debajo del encabezado sticky,
     cuya altura cambia según la vista. */
  function medirHeader() {
    var h = $('#topbar').offsetHeight;
    document.documentElement.style.setProperty('--header-h', h + 'px');
  }

  /* ═══════════════ Eventos ═══════════════ */

  function conectarEventos() {

    // --- Encabezado ---
    $('#brandBtn').onclick = function () { app.irA('catalogo'); };
    $('#themeBtn').onclick = alternarTema;
    $('#ordersBtn').onclick = function () { app.irA('pedidos'); };
    $('#cartBtn').onclick = ui.abrirCarrito;
    $('#cartBar').onclick = ui.abrirCarrito;
    $('#cartClose').onclick = ui.cerrarCarrito;
    $('#scrim').onclick = ui.cerrarCarrito;
    $('#adminLink').onclick = function () { app.irA('admin'); };
    $('#backFromOrders').onclick = function () { app.irA('catalogo'); };
    $('#modalClose').onclick = ui.cerrarModal;

    // Clic en el fondo del modal lo cierra; dentro de la caja, no.
    $('#modal').addEventListener('mousedown', function (e) {
      if (e.target === $('#modal')) ui.cerrarModal();
    });

    // --- Búsqueda ---
    var input = $('#searchInput');
    var clear = $('#searchClear');
    var temporizador;
    input.addEventListener('input', function () {
      clear.hidden = !input.value;
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        ui.filtro.q = input.value;
        ui.renderCatalogo();
      }, 140);
    });
    clear.onclick = function () {
      input.value = '';
      clear.hidden = true;
      ui.filtro.q = '';
      ui.renderCatalogo();
      input.focus();
    };

    // --- Categorías ---
    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      ui.filtro.cat = b.getAttribute('data-cat');
      ui.renderChips();
      ui.renderCatalogo();
    });

    // --- Agregar / quitar del carrito (delegado: sirve en catálogo y carrito) ---
    document.addEventListener('click', function (e) {
      var mas = e.target.closest('[data-mas]');
      if (mas) {
        store.agregarAlCarrito(mas.getAttribute('data-mas'), 1);
        return;
      }
      var menos = e.target.closest('[data-menos]');
      if (menos) {
        store.agregarAlCarrito(menos.getAttribute('data-menos'), -1);
        return;
      }
      var pagar = e.target.closest('[data-pagar]');
      if (pagar) {
        checkout.abrirPago(pagar.getAttribute('data-pagar'));
        return;
      }
      var repetir = e.target.closest('[data-repetir]');
      if (repetir) {
        checkout.repetir(repetir.getAttribute('data-repetir'));
        return;
      }
    });

    // --- Botones que se vuelven a dibujar dentro del carrito ---
    $('#cartFoot').addEventListener('click', function (e) {
      if (e.target.id === 'btnCheckout') {
        checkout.abrirFormulario();
      } else if (e.target.id === 'btnVaciar') {
        ui.confirmar('Vaciar pedido', '¿Quitar todos los productos del carrito?', function () {
          store.vaciarCarrito();
          ui.toast('Pedido vaciado');
        }, 'Vaciar');
      }
    });

    // --- Teclado ---
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$('#modal').hidden) ui.cerrarModal();
        else if (ui.cartAbierto) ui.cerrarCarrito();
      }
      // "/" enfoca el buscador, como en las apps de escritorio.
      if (e.key === '/' && app.vista === 'catalogo' &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        $('#searchInput').focus();
      }
    });

    // --- Navegación del navegador ---
    window.addEventListener('popstate', desdeHash);
    window.addEventListener('resize', medirHeader);
    window.addEventListener('orientationchange', function () {
      setTimeout(medirHeader, 200);
    });

    // Al pasar a pantalla ancha, el carrito deja de ser una hoja inferior.
    var ancha = window.matchMedia('(min-width: 1080px)');
    var alCambiar = function (ev) {
      if (ev.matches && ui.cartAbierto) ui.cerrarCarrito();
      medirHeader();
    };
    if (ancha.addEventListener) ancha.addEventListener('change', alCambiar);
    else if (ancha.addListener) ancha.addListener(alCambiar);
  }

  /* ═══════════════ Service worker (uso sin internet) ═══════════════ */

  function registrarSW() {
    if (!('serviceWorker' in navigator)) return;
    // file:// no admite service workers; hay que servir por http(s).
    if (location.protocol === 'file:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('[MovilDrink] service worker no registrado:', e);
      });
    });
  }

  /* ═══════════════ Arranque ═══════════════ */

  function iniciar() {
    iniciarTema();
    conectarEventos();

    // Cualquier cambio de estado vuelve a dibujar lo que corresponda.
    store.subscribe(function () {
      ui.renderCatalogo();
      ui.renderCarrito();
      if (app.vista === 'pedidos') ui.renderPedidos();
    });

    ui.render();
    desdeHash();
    medirHeader();
    registrarSW();

    // Primer arranque sin Yappy configurado: guía al vendedor.
    var s = store.state.settings;
    if (!s.yappyNumero && !store.state.pedidos.length) {
      setTimeout(function () {
        ui.toast('Configura tu número de Yappy en el Panel del vendedor');
      }, 1400);
    }
  }

  MD.app = app;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
