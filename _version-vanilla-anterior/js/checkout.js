/* ═══════════════════════════════════════════════════════════
   MovilDrink · checkout.js
   Formulario de pedido, pantalla de pago con Yappy y aviso
   por WhatsApp al vendedor.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var store = MD.store;
  var U = MD.util;
  var ui = MD.ui;

  var checkout = {};

  /* ═══════════════ Ayudas de teléfono ═══════════════ */

  /** Deja sólo dígitos. */
  function soloDigitos(s) {
    return String(s || '').replace(/\D+/g, '');
  }

  /**
   * Normaliza a formato internacional para wa.me: 507XXXXXXXX.
   * Acepta '6123-4567', '+507 6123 4567', '50761234567'.
   */
  function telInternacional(s) {
    var d = soloDigitos(s);
    if (!d) return '';
    if (d.indexOf('507') === 0 && d.length >= 10) return d;
    if (d.length === 8) return '507' + d;   // móvil o fijo panameño
    return d;
  }

  /** Formato bonito para mostrar: 6123-4567 */
  function telBonito(s) {
    var d = soloDigitos(s);
    if (d.indexOf('507') === 0 && d.length === 11) d = d.slice(3);
    if (d.length === 8) return d.slice(0, 4) + '-' + d.slice(4);
    if (d.length === 7) return d.slice(0, 3) + '-' + d.slice(3);
    return s;
  }

  function validaTelPanama(s) {
    var d = soloDigitos(s);
    if (d.indexOf('507') === 0) d = d.slice(3);
    return d.length === 7 || d.length === 8;
  }

  /** Copia al portapapeles con respaldo para navegadores antiguos / http. */
  function copiar(texto, etiqueta) {
    function ok() { ui.toast((etiqueta || 'Copiado') + ': ' + texto); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(ok, fallback);
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); ok(); }
      catch (e) { ui.toast('Copia manualmente: ' + texto, 'err'); }
      ta.remove();
    }
  }
  checkout.copiar = copiar;

  /* ═══════════════ Paso 1: datos del pedido ═══════════════ */

  checkout.abrirFormulario = function () {
    var t = store.totales();
    if (!t.items.length) {
      ui.toast('Tu pedido está vacío', 'err');
      return;
    }

    var s = store.state.settings;
    var c = store.state.cliente;

    var opcionesPago = '';

    if (s.yappyNumero) {
      opcionesPago +=
        '<label class="payopt">' +
          '<input type="radio" name="pago" value="yappy" checked>' +
          '<span class="payopt__ico payopt__ico--yappy">Y</span>' +
          '<span><b>Yappy</b><small>Transferencia inmediata desde tu banco</small></span>' +
        '</label>';
    }
    if (s.aceptaEfectivo) {
      opcionesPago +=
        '<label class="payopt">' +
          '<input type="radio" name="pago" value="efectivo"' + (s.yappyNumero ? '' : ' checked') + '>' +
          '<span class="payopt__ico">💵</span>' +
          '<span><b>Efectivo</b><small>Pagas al recibir el pedido</small></span>' +
        '</label>';
    }
    if (!opcionesPago) {
      opcionesPago = '<div class="note">El vendedor aún no configuró un método de pago. ' +
        'Entra al <b>Panel del vendedor</b> y agrega tu número de Yappy.</div>';
    }

    var html =
      '<form id="formPedido" novalidate>' +
        '<div class="row2">' +
          '<label class="field"><span>Tu nombre *</span>' +
            '<input name="nombre" type="text" autocomplete="name" required maxlength="60" ' +
              'value="' + U.escapeHtml(c.nombre) + '" placeholder="Ej. María Pérez">' +
          '</label>' +
          '<label class="field"><span>Celular *</span>' +
            '<input name="telefono" type="tel" inputmode="tel" autocomplete="tel" required ' +
              'value="' + U.escapeHtml(c.telefono) + '" placeholder="6123-4567">' +
          '</label>' +
        '</div>' +

        '<div class="payopts" style="margin-bottom:12px">' +
          '<label class="payopt">' +
            '<input type="radio" name="entrega" value="delivery" checked>' +
            '<span class="payopt__ico">🚗</span>' +
            '<span><b>Que me lo lleven</b><small>Indica la dirección abajo</small></span>' +
          '</label>' +
          '<label class="payopt">' +
            '<input type="radio" name="entrega" value="punto">' +
            '<span class="payopt__ico">📍</span>' +
            '<span><b>Lo recojo yo</b><small>Coordinamos el punto por WhatsApp</small></span>' +
          '</label>' +
        '</div>' +

        '<label class="field" id="campoDireccion"><span>Dirección o punto de referencia *</span>' +
          '<textarea name="direccion" maxlength="240" ' +
            'placeholder="Ej. Vía España, edificio Torres del Mar, piso 4, apto 4B. Portón azul.">' +
            U.escapeHtml(c.direccion) + '</textarea>' +
        '</label>' +

        '<label class="field"><span>Nota para el vendedor (opcional)</span>' +
          '<input name="nota" type="text" maxlength="140" placeholder="Ej. bien frías, sin hielo">' +
        '</label>' +

        '<div class="section-title">Método de pago</div>' +
        '<div class="payopts">' + opcionesPago + '</div>' +

        '<div class="totals">' +
          '<div class="totals__row"><span>Subtotal (' + t.unidades + ' art.)</span><span>' + U.money(t.subtotal) + '</span></div>' +
          (t.itbms > 0 ? '<div class="totals__row"><span>ITBMS ' + s.itbmsTasa + '%</span><span>' + U.money(t.itbms) + '</span></div>' : '') +
          '<div class="totals__row"><span>Entrega</span><span>' + (t.envio > 0 ? U.money(t.envio) : 'Gratis') + '</span></div>' +
          '<div class="totals__row totals__row--grand"><span>Total</span><span>' + U.money(t.total) + '</span></div>' +
        '</div>' +

        '<button class="btn btn--block" type="submit"' + (opcionesPago.indexOf('input') === -1 ? ' disabled' : '') + '>' +
          'Confirmar pedido · ' + U.money(t.total) +
        '</button>' +
      '</form>';

    ui.modal('Datos del pedido', html, function (body) {
      var form = body.querySelector('#formPedido');
      var campoDir = body.querySelector('#campoDireccion');

      // La dirección sólo aplica si piden entrega a domicilio.
      form.addEventListener('change', function (e) {
        if (e.target.name === 'entrega') {
          campoDir.hidden = e.target.value === 'punto';
        }
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var datos = {
          nombre: form.nombre.value.trim(),
          telefono: form.telefono.value.trim(),
          direccion: form.direccion.value.trim(),
          nota: form.nota.value.trim(),
          entrega: (form.querySelector('input[name=entrega]:checked') || {}).value || 'delivery',
          pago: (form.querySelector('input[name=pago]:checked') || {}).value || 'efectivo'
        };

        var errores = [];
        if (datos.nombre.length < 2) errores.push(['nombre', 'Escribe tu nombre.']);
        if (!validaTelPanama(datos.telefono)) errores.push(['telefono', 'Celular panameño de 8 dígitos. Ej. 6123-4567']);
        if (datos.entrega === 'delivery' && datos.direccion.length < 8) {
          errores.push(['direccion', 'Necesitamos saber a dónde llevarlo.']);
        }

        // Limpia errores previos
        Array.prototype.forEach.call(form.querySelectorAll('.err'), function (n) { n.remove(); });
        Array.prototype.forEach.call(form.querySelectorAll('.field--error'), function (n) {
          n.classList.remove('field--error');
        });

        if (errores.length) {
          errores.forEach(function (par) {
            var input = form[par[0]];
            var campo = input.closest('.field');
            campo.classList.add('field--error');
            var span = document.createElement('span');
            span.className = 'err';
            span.textContent = par[1];
            campo.appendChild(span);
          });
          form[errores[0][0]].focus();
          return;
        }

        if (datos.entrega === 'punto') datos.direccion = 'Retiro en punto acordado';

        var pedido = store.crearPedido(datos);
        ui.cerrarCarrito();
        checkout.abrirPago(pedido.id);
      });
    });
  };

  /* ═══════════════ Paso 2: pago ═══════════════ */

  checkout.abrirPago = function (pedidoId) {
    var o = store.pedido(pedidoId);
    if (!o) { ui.toast('No encontramos ese pedido', 'err'); return; }
    var s = store.state.settings;

    var html = '';

    if (o.pago === 'yappy') {
      html +=
        '<div class="paybox">' +
          '<div class="paybox__label">Monto a enviar por Yappy</div>' +
          '<div class="paybox__amount">' + U.money(o.total) + '</div>' +
          (s.yappyQR
            ? '<img class="paybox__qr" src="' + U.escapeHtml(s.yappyQR) + '" alt="Código QR de Yappy del vendedor">'
            : '') +
          '<div class="copyrow">' +
            '<div style="flex:1;min-width:0">' +
              '<span class="copyrow__key">Número Yappy' + (s.yappyNombre ? ' · ' + U.escapeHtml(s.yappyNombre) : '') + '</span>' +
              '<div class="copyrow__val">' + U.escapeHtml(telBonito(s.yappyNumero)) + '</div>' +
            '</div>' +
            '<button class="btn btn--ghost btn--sm" data-copiar="' + U.escapeHtml(soloDigitos(s.yappyNumero)) + '" data-etq="Número">Copiar</button>' +
          '</div>' +
          '<div class="copyrow">' +
            '<div style="flex:1;min-width:0">' +
              '<span class="copyrow__key">Concepto / descripción</span>' +
              '<div class="copyrow__val">' + U.escapeHtml(o.codigo) + '</div>' +
            '</div>' +
            '<button class="btn btn--ghost btn--sm" data-copiar="' + U.escapeHtml(o.codigo) + '" data-etq="Código">Copiar</button>' +
          '</div>' +
        '</div>' +

        '<ol class="steps">' +
          '<li>Abre tu app de banco y entra a <b>Yappy</b>.</li>' +
          '<li>Yappea <b>' + U.money(o.total) + '</b> al número <b>' + U.escapeHtml(telBonito(s.yappyNumero)) + '</b>.</li>' +
          '<li>En la descripción escribe <b>' + U.escapeHtml(o.codigo) + '</b> para identificar tu pedido.</li>' +
          '<li>Vuelve aquí y avísanos con el botón de abajo.</li>' +
        '</ol>' +

        '<button class="btn btn--yappy btn--block" data-abrir-yappy style="margin-bottom:10px">' +
          'Abrir la app de Yappy' +
        '</button>';
    } else {
      html +=
        '<div class="paybox">' +
          '<div class="paybox__label">Pagas en efectivo al recibir</div>' +
          '<div class="paybox__amount">' + U.money(o.total) + '</div>' +
          '<p style="margin:0;color:var(--text-dim);font-size:.88rem">' +
            'Ten el monto listo. Si necesitas cambio, dínoslo en el mensaje.' +
          '</p>' +
        '</div>';
    }

    html +=
      '<div class="note">' +
        'Guarda tu código <b>' + U.escapeHtml(o.codigo) + '</b>. ' +
        'Puedes volver a ver este pedido en <b>Mis pedidos</b>.' +
      '</div>';

    if (s.whatsapp) {
      html += '<button class="btn btn--wa btn--block" data-wa style="margin-bottom:10px">' +
        (o.pago === 'yappy' ? 'Ya yappeé · avisar por WhatsApp' : 'Enviar el pedido por WhatsApp') +
        '</button>';
    } else {
      html += '<div class="note">El vendedor no ha configurado WhatsApp. ' +
        'Copia el resumen y envíaselo por donde prefieras.</div>' +
        '<button class="btn btn--ghost btn--block" data-copiar-resumen style="margin-bottom:10px">Copiar resumen del pedido</button>';
    }

    html += '<button class="btn btn--ghost btn--block" data-cerrar>Listo</button>';

    ui.modal(o.pago === 'yappy' ? 'Paga con Yappy' : 'Confirma tu pedido', html, function (body) {

      Array.prototype.forEach.call(body.querySelectorAll('[data-copiar]'), function (b) {
        b.onclick = function () { copiar(b.getAttribute('data-copiar'), b.getAttribute('data-etq')); };
      });

      var abrirY = body.querySelector('[data-abrir-yappy]');
      if (abrirY) abrirY.onclick = function () { checkout.abrirAppYappy(o); };

      var wa = body.querySelector('[data-wa]');
      if (wa) wa.onclick = function () {
        checkout.avisarWhatsApp(o);
        store.cambiarEstadoPedido(o.id, o.pago === 'yappy' ? 'pagado' : 'pendiente');
      };

      var res = body.querySelector('[data-copiar-resumen]');
      if (res) res.onclick = function () { copiar(checkout.resumenTexto(o), 'Resumen'); };

      body.querySelector('[data-cerrar]').onclick = function () {
        ui.cerrarModal();
        MD.app.irA('pedidos');
      };
    });
  };

  /**
   * Intenta abrir la app de Yappy con su esquema propio.
   * No hay un enlace profundo oficial y público para "pagar a un número",
   * así que esto es un atajo: si el sistema no lo reconoce, dejamos al
   * cliente con las instrucciones y el número ya copiado.
   */
  checkout.abrirAppYappy = function (o) {
    var s = store.state.settings;
    copiar(soloDigitos(s.yappyNumero), 'Número Yappy');

    var volvio = false;
    var onHide = function () { volvio = true; };
    document.addEventListener('visibilitychange', onHide, { once: true });

    var t0 = Date.now();
    window.location.href = 'yappy://';

    setTimeout(function () {
      document.removeEventListener('visibilitychange', onHide);
      // Si seguimos aquí y no hubo cambio de visibilidad, la app no abrió.
      if (!volvio && Date.now() - t0 < 2500 && !document.hidden) {
        ui.toast('Abre Yappy manualmente. Ya copiamos el número.', 'err');
      }
    }, 1200);
  };

  /* ═══════════════ Resumen y WhatsApp ═══════════════ */

  checkout.resumenTexto = function (o) {
    var s = store.state.settings;
    var L = [];
    L.push('*' + (s.nombre || 'MovilDrink') + '* — Pedido ' + o.codigo);
    L.push('');
    o.items.forEach(function (l) {
      L.push('• ' + l.qty + '× ' + l.nombre + ' — ' + U.money(l.subtotal));
    });
    L.push('');
    L.push('Subtotal: ' + U.money(o.subtotal));
    if (o.itbms > 0) L.push('ITBMS: ' + U.money(o.itbms));
    if (o.envio > 0) L.push('Entrega: ' + U.money(o.envio));
    L.push('*TOTAL: ' + U.money(o.total) + '*');
    L.push('');
    L.push('Pago: ' + (o.pago === 'yappy' ? 'Yappy' : 'Efectivo al recibir'));
    L.push('Cliente: ' + o.cliente.nombre + ' (' + telBonito(o.cliente.telefono) + ')');
    L.push(o.entrega === 'punto' ? 'Entrega: lo recojo yo' : 'Dirección: ' + o.cliente.direccion);
    if (o.cliente.nota) L.push('Nota: ' + o.cliente.nota);
    if (o.pago === 'yappy') {
      L.push('');
      L.push('Ya yappeé ' + U.money(o.total) + ' con la descripción ' + o.codigo + '.');
    }
    return L.join('\n');
  };

  checkout.avisarWhatsApp = function (o) {
    var s = store.state.settings;
    var num = telInternacional(s.whatsapp);
    if (!num) {
      ui.toast('No hay WhatsApp configurado', 'err');
      return;
    }
    var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(checkout.resumenTexto(o));
    window.open(url, '_blank', 'noopener');
  };

  /* ═══════════════ Repetir pedido ═══════════════ */

  checkout.repetir = function (pedidoId) {
    var o = store.pedido(pedidoId);
    if (!o) return;

    store.vaciarCarrito();
    var faltantes = [];
    o.items.forEach(function (l) {
      var p = store.producto(l.id);
      if (!p || !p.activo || p.stock <= 0) {
        faltantes.push(l.nombre);
        return;
      }
      var cant = Math.min(l.qty, p.stock);
      store.cart.push({ id: p.id, qty: cant });
      if (cant < l.qty) faltantes.push(l.nombre + ' (sólo ' + cant + ')');
    });
    store.emit();

    if (!store.cart.length) {
      ui.toast('Ninguno de esos productos está disponible', 'err');
      return;
    }
    MD.app.irA('catalogo');
    ui.abrirCarrito();
    ui.toast(faltantes.length ? 'Agregado. Sin stock: ' + faltantes.join(', ') : 'Pedido cargado en el carrito');
  };

  checkout.telBonito = telBonito;
  checkout.telInternacional = telInternacional;
  checkout.soloDigitos = soloDigitos;

  MD.checkout = checkout;
})();
