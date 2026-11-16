/* ═══════════════════════════════════════════════════════════
   MovilDrink · ui.js
   Render del catálogo y del carrito, modales y avisos.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var store = MD.store;
  var U = MD.util;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var ui = {
    filtro: { cat: 'todas', q: '' },
    cartAbierto: false,
    _modalPrevFocus: null
  };

  /* ═══════════════ Avisos (toasts) ═══════════════ */

  ui.toast = function (mensaje, tipo) {
    var cont = $('#toasts');
    if (!cont) return;
    var el = document.createElement('div');
    el.className = 'toast toast--' + (tipo === 'err' ? 'err' : 'ok');
    el.textContent = mensaje;
    cont.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 220);
    }, tipo === 'err' ? 3200 : 2200);
  };

  /* ═══════════════ Modal genérico ═══════════════ */

  ui.modal = function (titulo, html, onOpen) {
    var m = $('#modal');
    $('#modalTitle').textContent = titulo;
    $('#modalBody').innerHTML = html;
    ui._modalPrevFocus = document.activeElement;
    m.hidden = false;
    document.body.classList.add('is-locked');
    if (typeof onOpen === 'function') onOpen($('#modalBody'));
    // Enfoca el primer control para que teclado y lectores de pantalla entren al modal.
    var first = $('#modalBody').querySelector('input, select, textarea, button, a[href]');
    if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
  };

  ui.cerrarModal = function () {
    var m = $('#modal');
    if (m.hidden) return;
    m.hidden = true;
    $('#modalBody').innerHTML = '';
    if (!ui.cartAbierto) document.body.classList.remove('is-locked');
    if (ui._modalPrevFocus && ui._modalPrevFocus.focus) {
      try { ui._modalPrevFocus.focus({ preventScroll: true }); } catch (e) {}
    }
    ui._modalPrevFocus = null;
  };

  ui.confirmar = function (titulo, texto, onSi, textoBoton) {
    ui.modal(titulo,
      '<p>' + U.escapeHtml(texto) + '</p>' +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button class="btn btn--ghost" style="flex:1" data-no>Cancelar</button>' +
        '<button class="btn btn--danger" style="flex:1" data-si>' + U.escapeHtml(textoBoton || 'Sí, continuar') + '</button>' +
      '</div>',
      function (body) {
        body.querySelector('[data-no]').onclick = ui.cerrarModal;
        body.querySelector('[data-si]').onclick = function () {
          ui.cerrarModal();
          onSi();
        };
      });
  };

  /* ═══════════════ Chips de categoría ═══════════════ */

  ui.renderChips = function () {
    var cont = $('#chips');
    if (!cont) return;

    var visibles = store.productosVisibles();
    var conteo = {};
    visibles.forEach(function (p) { conteo[p.cat] = (conteo[p.cat] || 0) + 1; });

    var html = '<button class="chip" type="button" data-cat="todas" aria-pressed="' +
      (ui.filtro.cat === 'todas') + '">Todo (' + visibles.length + ')</button>';

    MD.CATEGORIAS.forEach(function (c) {
      if (!conteo[c.id]) return; // no muestra categorías vacías
      html += '<button class="chip" type="button" data-cat="' + c.id + '" aria-pressed="' +
        (ui.filtro.cat === c.id) + '">' + c.emoji + ' ' + U.escapeHtml(c.nombre) +
        ' (' + conteo[c.id] + ')</button>';
    });

    cont.innerHTML = html;
  };

  /* ═══════════════ Catálogo ═══════════════ */

  function coincide(p) {
    if (ui.filtro.cat !== 'todas' && p.cat !== ui.filtro.cat) return false;
    var q = U.norm(ui.filtro.q).trim();
    if (!q) return true;
    var heno = U.norm(p.nombre + ' ' + p.desc + ' ' + p.cat);
    // Todas las palabras buscadas deben aparecer.
    return q.split(/\s+/).every(function (w) { return heno.indexOf(w) !== -1; });
  }

  function mediaHtml(p, clase) {
    if (p.img) {
      return '<div class="' + clase + '"><img src="' + U.escapeHtml(p.img) +
        '" alt="" loading="lazy" decoding="async"></div>';
    }
    return '<div class="' + clase + '" aria-hidden="true">' + U.escapeHtml(p.emoji || '🥤') + '</div>';
  }

  ui.renderCatalogo = function () {
    var grid = $('#productGrid');
    var vacio = $('#emptyCatalog');
    if (!grid) return;

    var lista = store.productosVisibles()
      .filter(coincide)
      .sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });

    vacio.hidden = lista.length > 0;

    grid.innerHTML = lista.map(function (p) {
      var enCarrito = store.cantidadEnCarrito(p.id);
      var agotado = p.stock <= 0;
      var pocas = !agotado && p.stock <= 5;

      var badge = agotado
        ? '<span class="card__badge">Agotado</span>'
        : (pocas ? '<span class="card__badge card__badge--low">Quedan ' + p.stock + '</span>' : '');

      var control;
      if (agotado) {
        control = '<button class="addbtn" type="button" disabled aria-label="Agotado">×</button>';
      } else if (enCarrito > 0) {
        control =
          '<div class="stepper">' +
            '<button type="button" data-menos="' + p.id + '" aria-label="Quitar uno de ' + U.escapeHtml(p.nombre) + '">−</button>' +
            '<span aria-live="polite">' + enCarrito + '</span>' +
            '<button type="button" data-mas="' + p.id + '"' + (enCarrito >= p.stock ? ' disabled' : '') +
              ' aria-label="Agregar uno de ' + U.escapeHtml(p.nombre) + '">+</button>' +
          '</div>';
      } else {
        control = '<button class="addbtn" type="button" data-mas="' + p.id +
          '" aria-label="Agregar ' + U.escapeHtml(p.nombre) + ' al carrito">+</button>';
      }

      return '' +
        '<article class="card' + (agotado ? ' is-out' : '') + '">' +
          mediaHtml(p, 'card__media') + badge +
          '<div class="card__body">' +
            '<h3 class="card__name">' + U.escapeHtml(p.nombre) + '</h3>' +
            (p.desc ? '<p class="card__desc">' + U.escapeHtml(p.desc) + '</p>' : '') +
            '<div class="card__foot">' +
              '<span class="card__price">' + U.money(p.precio) + '</span>' +
              control +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  };

  /* ═══════════════ Carrito ═══════════════ */

  ui.renderCarrito = function () {
    var body = $('#cartBody');
    var foot = $('#cartFoot');
    if (!body) return;

    var t = store.totales();
    var s = store.state.settings;

    if (!t.items.length) {
      body.innerHTML =
        '<p class="empty"><span aria-hidden="true">🛒</span>Tu pedido está vacío.<br>Agrega bebidas o confituras del catálogo.</p>';
      foot.innerHTML = '';
    } else {
      body.innerHTML = t.items.map(function (l) {
        return '' +
          '<div class="citem">' +
            mediaHtml(l, 'citem__media') +
            '<div class="citem__info">' +
              '<div class="citem__name">' + U.escapeHtml(l.nombre) + '</div>' +
              '<div class="citem__meta">' + U.money(l.precio) + ' c/u</div>' +
            '</div>' +
            '<div class="citem__right">' +
              '<span class="citem__sum">' + U.money(l.subtotal) + '</span>' +
              '<div class="stepper stepper--sm">' +
                '<button type="button" data-menos="' + l.id + '" aria-label="Quitar uno">−</button>' +
                '<span>' + l.qty + '</span>' +
                '<button type="button" data-mas="' + l.id + '"' + (l.qty >= l.stock ? ' disabled' : '') +
                  ' aria-label="Agregar uno">+</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }).join('');

      var filas = '<div class="totals__row"><span>Subtotal (' + t.unidades + ' art.)</span><span>' + U.money(t.subtotal) + '</span></div>';
      if (t.itbms > 0) {
        filas += '<div class="totals__row"><span>ITBMS ' + s.itbmsTasa + '%</span><span>' + U.money(t.itbms) + '</span></div>';
      }
      if (t.envio > 0) {
        filas += '<div class="totals__row"><span>Entrega</span><span>' + U.money(t.envio) + '</span></div>';
      } else {
        filas += '<div class="totals__row"><span>Entrega</span><span>Gratis</span></div>';
      }
      filas += '<div class="totals__row totals__row--grand"><span>Total</span><span>' + U.money(t.total) + '</span></div>';

      var minimo = Number(s.minimoPedido) || 0;
      var faltaMinimo = minimo > 0 && t.subtotal < minimo;
      var cerrado = !s.abierto;

      var aviso = '';
      if (cerrado) {
        aviso = '<div class="note">' + U.escapeHtml(s.mensajeCerrado || 'Cerrado por ahora.') + '</div>';
      } else if (faltaMinimo) {
        aviso = '<div class="note">El pedido mínimo es ' + U.money(minimo) +
          '. Te faltan ' + U.money(minimo - t.subtotal) + '.</div>';
      }

      foot.innerHTML =
        '<div class="totals">' + filas + '</div>' + aviso +
        '<button class="btn btn--block" id="btnCheckout"' +
          (faltaMinimo || cerrado ? ' disabled' : '') + '>Continuar al pago</button>' +
        '<button class="linkbtn" id="btnVaciar" style="display:block;margin:11px auto 0">Vaciar pedido</button>';
    }

    // Botón flotante y contador del encabezado
    var count = $('#cartCount');
    count.textContent = t.unidades;
    count.hidden = t.unidades === 0;

    var bar = $('#cartBar');
    bar.hidden = t.unidades === 0 || ui.cartAbierto;
    $('#cartBarQty').textContent = t.unidades;
    $('#cartBarTotal').textContent = U.money(t.total);
  };

  ui.abrirCarrito = function () {
    if (window.matchMedia('(min-width: 1080px)').matches) {
      // En laptop el carrito ya está visible al costado.
      $('#cartPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    ui.cartAbierto = true;
    $('#cartPanel').classList.add('is-open');
    $('#cartPanel').setAttribute('aria-hidden', 'false');
    $('#scrim').hidden = false;
    document.body.classList.add('is-locked');
    ui.renderCarrito();
  };

  ui.cerrarCarrito = function () {
    ui.cartAbierto = false;
    $('#cartPanel').classList.remove('is-open');
    $('#cartPanel').setAttribute('aria-hidden', 'true');
    $('#scrim').hidden = true;
    if ($('#modal').hidden) document.body.classList.remove('is-locked');
    ui.renderCarrito();
  };

  /* ═══════════════ Pedidos del cliente ═══════════════ */

  ui.renderPedidos = function () {
    var cont = $('#ordersList');
    if (!cont) return;
    var pedidos = store.state.pedidos;

    if (!pedidos.length) {
      cont.innerHTML = '<p class="empty"><span aria-hidden="true">🧾</span>Todavía no hay pedidos.</p>';
      return;
    }

    cont.innerHTML = pedidos.map(function (o) {
      var est = MD.ESTADOS[o.estado] || MD.ESTADOS.pendiente;
      var lineas = o.items.map(function (l) {
        return l.qty + '× ' + U.escapeHtml(l.nombre);
      }).join(' · ');

      var acciones = '';
      if (o.pago === 'yappy' && o.estado === 'pendiente') {
        acciones += '<button class="btn btn--yappy btn--sm" data-pagar="' + o.id + '">Ver datos de pago</button>';
      }
      acciones += '<button class="btn btn--ghost btn--sm" data-repetir="' + o.id + '">Repetir pedido</button>';

      return '' +
        '<article class="order">' +
          '<div class="order__head">' +
            '<div>' +
              '<div class="order__code">' + U.escapeHtml(o.codigo) + '</div>' +
              '<div class="order__date">' + U.escapeHtml(U.fechaLarga(o.fecha)) + '</div>' +
            '</div>' +
            '<span class="tag ' + est.tag + '">' + est.label + '</span>' +
          '</div>' +
          '<div class="order__lines">' + lineas + '</div>' +
          '<div class="order__foot">' +
            '<span class="order__total">' + U.money(o.total) + '</span>' +
            '<div style="display:flex;gap:7px;flex-wrap:wrap">' + acciones + '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  };

  /* ═══════════════ Render global ═══════════════ */

  ui.render = function () {
    var s = store.state.settings;
    $('#brandName').textContent = s.nombre || 'MovilDrink';
    $('#brandTag').textContent = s.abierto ? (s.eslogan || '') : '● Cerrado ahora';
    $('#footBrand').textContent = s.nombre || 'MovilDrink';
    document.title = (s.nombre || 'MovilDrink') + ' · Bebidas y confituras';

    ui.renderChips();
    ui.renderCatalogo();
    ui.renderCarrito();
    if (!$('#view-pedidos').hidden) ui.renderPedidos();
  };

  MD.ui = ui;
  MD.$ = $;
  MD.$$ = $$;
})();
