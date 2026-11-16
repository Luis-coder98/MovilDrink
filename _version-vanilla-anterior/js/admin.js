/* ═══════════════════════════════════════════════════════════
   MovilDrink · admin.js
   Panel del vendedor: productos, pedidos, ajustes y respaldo.

   Nota de seguridad: el PIN sólo evita que un cliente curioso
   toque los precios desde el mismo teléfono. No es seguridad real
   — todo corre en el navegador. No pongas aquí nada sensible.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var store = MD.store;
  var U = MD.util;
  var ui = MD.ui;
  var $ = MD.$;

  var admin = {
    desbloqueado: false,
    tab: 'productos'
  };

  /* ═══════════════ Imágenes ═══════════════ */

  /**
   * Reduce una imagen a un cuadrado de `lado` px y la devuelve como
   * dataURL JPEG. Sin esto, tres fotos de celular llenan el
   * localStorage (límite ~5 MB) y la app deja de guardar.
   */
  function comprimirImagen(file, lado, calidad) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) {
        reject(new Error('Ese archivo no es una imagen.'));
        return;
      }
      var lector = new FileReader();
      lector.onerror = function () { reject(new Error('No se pudo leer el archivo.')); };
      lector.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Imagen dañada o no soportada.')); };
        img.onload = function () {
          var L = lado || 420;
          var canvas = document.createElement('canvas');
          canvas.width = L;
          canvas.height = L;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, L, L);
          // Recorte centrado tipo "cover".
          var lado0 = Math.min(img.width, img.height);
          var sx = (img.width - lado0) / 2;
          var sy = (img.height - lado0) / 2;
          ctx.drawImage(img, sx, sy, lado0, lado0, 0, 0, L, L);
          resolve(canvas.toDataURL('image/jpeg', calidad || 0.78));
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(file);
    });
  }

  /* ═══════════════ Acceso ═══════════════ */

  admin.pedirPin = function () {
    ui.modal('Panel del vendedor',
      '<form id="formPin">' +
        '<label class="field"><span>PIN de acceso</span>' +
          '<input name="pin" type="password" inputmode="numeric" autocomplete="off" ' +
            'maxlength="12" placeholder="••••" required>' +
          '<small>PIN inicial: <b>1234</b>. Cámbialo en Ajustes.</small>' +
        '</label>' +
        '<button class="btn btn--block" type="submit">Entrar</button>' +
      '</form>',
      function (body) {
        var form = body.querySelector('#formPin');
        form.onsubmit = function (e) {
          e.preventDefault();
          if (form.pin.value === String(store.state.settings.pin)) {
            admin.desbloqueado = true;
            ui.cerrarModal();
            MD.app.irA('admin');
          } else {
            var campo = form.pin.closest('.field');
            campo.classList.add('field--error');
            if (!campo.querySelector('.err')) {
              var s = document.createElement('span');
              s.className = 'err';
              s.textContent = 'PIN incorrecto.';
              campo.appendChild(s);
            }
            form.pin.select();
          }
        };
      });
  };

  /* ═══════════════ Render principal ═══════════════ */

  admin.render = function () {
    var root = $('#adminRoot');
    if (!root) return;

    if (!admin.desbloqueado) {
      root.innerHTML =
        '<p class="empty"><span aria-hidden="true">🔒</span>Panel bloqueado.</p>' +
        '<div style="max-width:280px;margin:0 auto"><button class="btn btn--block" id="btnPin">Ingresar PIN</button></div>';
      root.querySelector('#btnPin').onclick = admin.pedirPin;
      return;
    }

    root.innerHTML =
      '<div class="viewhead">' +
        '<h1>Panel del vendedor</h1>' +
        '<div style="display:flex;gap:8px">' +
          '<button class="btn btn--ghost btn--sm" id="btnSalirAdmin">Bloquear</button>' +
          '<button class="btn btn--ghost btn--sm" id="btnVerTienda">Ver tienda</button>' +
        '</div>' +
      '</div>' +
      '<div class="tabs" role="tablist">' +
        tabBtn('productos', 'Productos') +
        tabBtn('pedidos', 'Pedidos') +
        tabBtn('ajustes', 'Ajustes') +
        tabBtn('respaldo', 'Respaldo') +
      '</div>' +
      '<div id="adminTab"></div>';

    root.querySelector('#btnSalirAdmin').onclick = function () {
      admin.desbloqueado = false;
      MD.app.irA('catalogo');
      ui.toast('Panel bloqueado');
    };
    root.querySelector('#btnVerTienda').onclick = function () { MD.app.irA('catalogo'); };

    Array.prototype.forEach.call(root.querySelectorAll('.tab'), function (b) {
      b.onclick = function () {
        admin.tab = b.getAttribute('data-tab');
        admin.render();
      };
    });

    var cont = root.querySelector('#adminTab');
    if (admin.tab === 'productos') admin.renderProductos(cont);
    else if (admin.tab === 'pedidos') admin.renderPedidos(cont);
    else if (admin.tab === 'ajustes') admin.renderAjustes(cont);
    else admin.renderRespaldo(cont);
  };

  function tabBtn(id, label) {
    return '<button class="tab" role="tab" data-tab="' + id + '" aria-selected="' +
      (admin.tab === id) + '">' + label + '</button>';
  }

  /* ═══════════════ Pestaña: productos ═══════════════ */

  admin.renderProductos = function (cont) {
    var ps = store.state.productos.slice().sort(function (a, b) {
      return (a.orden || 0) - (b.orden || 0);
    });
    var agotados = ps.filter(function (p) { return p.activo && p.stock <= 0; }).length;
    var bajos = ps.filter(function (p) { return p.activo && p.stock > 0 && p.stock <= 5; }).length;
    var valor = ps.reduce(function (a, p) { return a + p.precio * p.stock; }, 0);

    cont.innerHTML =
      '<div class="stats">' +
        stat('Productos activos', ps.filter(function (p) { return p.activo; }).length) +
        stat('Agotados', agotados) +
        stat('Stock bajo (≤5)', bajos) +
        stat('Valor del inventario', U.money(valor)) +
      '</div>' +

      '<div class="adminbar">' +
        '<button class="btn btn--sm" id="btnNuevo">+ Nuevo producto</button>' +
        '<button class="btn btn--ghost btn--sm" id="btnReponer">Reponer stock</button>' +
      '</div>' +

      '<div class="plist">' +
        ps.map(function (p) {
          var cat = MD.CATEGORIAS.find(function (c) { return c.id === p.cat; });
          var media = p.img
            ? '<div class="prow__media"><img src="' + U.escapeHtml(p.img) + '" alt=""></div>'
            : '<div class="prow__media">' + U.escapeHtml(p.emoji || '🥤') + '</div>';
          return '' +
            '<div class="prow' + (p.activo ? '' : ' is-off') + '">' +
              media +
              '<div class="prow__info">' +
                '<div class="prow__name">' + U.escapeHtml(p.nombre) + (p.activo ? '' : ' · oculto') + '</div>' +
                '<div class="prow__meta">' + U.money(p.precio) + ' · ' +
                  (cat ? cat.emoji + ' ' + U.escapeHtml(cat.nombre) : U.escapeHtml(p.cat)) + ' · ' +
                  (p.stock <= 0 ? '<b style="color:var(--danger)">agotado</b>' : p.stock + ' en stock') +
                '</div>' +
              '</div>' +
              '<div class="prow__acts">' +
                '<button class="btn btn--ghost btn--sm" data-edit="' + p.id + '">Editar</button>' +
              '</div>' +
            '</div>';
        }).join('') +
      '</div>';

    cont.querySelector('#btnNuevo').onclick = function () { admin.editarProducto(null); };
    cont.querySelector('#btnReponer').onclick = admin.reponerStock;
    Array.prototype.forEach.call(cont.querySelectorAll('[data-edit]'), function (b) {
      b.onclick = function () { admin.editarProducto(b.getAttribute('data-edit')); };
    });
  };

  function stat(k, v) {
    return '<div class="stat"><div class="stat__k">' + k + '</div><div class="stat__v">' + v + '</div></div>';
  }

  admin.editarProducto = function (id) {
    var p = id ? store.producto(id) : {
      nombre: '', cat: 'bebidas', precio: '', stock: '', emoji: '🥤', img: '', desc: '', activo: true
    };
    if (!p) return;

    var cats = MD.CATEGORIAS.map(function (c) {
      return '<option value="' + c.id + '"' + (p.cat === c.id ? ' selected' : '') + '>' +
        c.emoji + ' ' + U.escapeHtml(c.nombre) + '</option>';
    }).join('');

    var emojis = MD.EMOJIS.map(function (e) {
      return '<button type="button" data-emoji="' + e + '" aria-pressed="' + (p.emoji === e) + '">' + e + '</button>';
    }).join('');

    var html =
      '<form id="formProd">' +
        '<label class="field"><span>Nombre *</span>' +
          '<input name="nombre" required maxlength="70" value="' + U.escapeHtml(p.nombre) + '" placeholder="Ej. Coca-Cola 500 ml">' +
        '</label>' +
        '<label class="field"><span>Descripción corta</span>' +
          '<input name="desc" maxlength="70" value="' + U.escapeHtml(p.desc) + '" placeholder="Ej. bien fría">' +
        '</label>' +
        '<div class="row2">' +
          '<label class="field"><span>Precio (' + U.escapeHtml(store.state.settings.moneda) + ') *</span>' +
            '<input name="precio" type="number" inputmode="decimal" step="0.05" min="0" required value="' + p.precio + '">' +
          '</label>' +
          '<label class="field"><span>Stock *</span>' +
            '<input name="stock" type="number" inputmode="numeric" step="1" min="0" required value="' + p.stock + '">' +
          '</label>' +
        '</div>' +
        '<label class="field"><span>Categoría</span><select name="cat">' + cats + '</select></label>' +

        '<div class="field"><span>Ícono</span>' +
          '<div class="emojipick" id="emojiPick">' + emojis + '</div>' +
          '<input type="hidden" name="emoji" value="' + U.escapeHtml(p.emoji) + '">' +
        '</div>' +

        '<div class="field"><span>Foto (opcional, reemplaza el ícono)</span>' +
          '<input type="file" name="foto" accept="image/*">' +
          '<small>Se reduce a 420×420 px automáticamente para no llenar la memoria.</small>' +
          '<div id="previewFoto" style="margin-top:9px">' +
            (p.img
              ? '<img src="' + U.escapeHtml(p.img) + '" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:12px">' +
                '<button type="button" class="btn btn--ghost btn--sm" id="quitarFoto" style="margin-left:10px">Quitar foto</button>'
              : '') +
          '</div>' +
          '<input type="hidden" name="img" value="' + U.escapeHtml(p.img) + '">' +
        '</div>' +

        '<label class="switch">' +
          '<input type="checkbox" name="activo"' + (p.activo ? ' checked' : '') + '>' +
          '<span>Visible en el catálogo<small>Desmárcalo para ocultarlo sin borrarlo</small></span>' +
        '</label>' +

        '<div style="display:flex;gap:10px;margin-top:6px">' +
          (id ? '<button type="button" class="btn btn--ghost" id="btnBorrar" style="flex:none">Borrar</button>' : '') +
          '<button class="btn" type="submit" style="flex:1">Guardar</button>' +
        '</div>' +
      '</form>';

    ui.modal(id ? 'Editar producto' : 'Nuevo producto', html, function (body) {
      var form = body.querySelector('#formProd');

      // Selector de emoji
      body.querySelector('#emojiPick').onclick = function (e) {
        var b = e.target.closest('[data-emoji]');
        if (!b) return;
        form.emoji.value = b.getAttribute('data-emoji');
        Array.prototype.forEach.call(body.querySelectorAll('[data-emoji]'), function (x) {
          x.setAttribute('aria-pressed', x === b);
        });
      };

      // Foto
      var prev = body.querySelector('#previewFoto');
      function conectarQuitar() {
        var q = body.querySelector('#quitarFoto');
        if (q) q.onclick = function () { form.img.value = ''; prev.innerHTML = ''; };
      }
      conectarQuitar();

      form.foto.onchange = function () {
        var f = form.foto.files && form.foto.files[0];
        if (!f) return;
        prev.innerHTML = '<small style="color:var(--text-dim)">Procesando…</small>';
        comprimirImagen(f, 420, 0.78).then(function (dataUrl) {
          form.img.value = dataUrl;
          prev.innerHTML =
            '<img src="' + dataUrl + '" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:12px">' +
            '<button type="button" class="btn btn--ghost btn--sm" id="quitarFoto" style="margin-left:10px">Quitar foto</button>';
          conectarQuitar();
        }).catch(function (err) {
          prev.innerHTML = '';
          ui.toast(err.message, 'err');
        });
      };

      if (id) {
        body.querySelector('#btnBorrar').onclick = function () {
          ui.confirmar('Borrar producto',
            '¿Seguro que quieres borrar "' + p.nombre + '"? Los pedidos anteriores se conservan.',
            function () {
              store.borrarProducto(id);
              ui.toast('Producto borrado');
              admin.render();
            }, 'Sí, borrar');
        };
      }

      form.onsubmit = function (e) {
        e.preventDefault();
        var datos = {
          nombre: form.nombre.value.trim(),
          desc: form.desc.value.trim(),
          precio: parseFloat(form.precio.value) || 0,
          stock: parseInt(form.stock.value, 10) || 0,
          cat: form.cat.value,
          emoji: form.emoji.value || '🥤',
          img: form.img.value,
          activo: form.activo.checked
        };
        if (!datos.nombre) { form.nombre.focus(); return; }

        if (id) {
          store.actualizarProducto(id, datos);
          ui.toast('Producto actualizado');
        } else {
          store.agregarProducto(datos);
          ui.toast('Producto agregado');
        }
        ui.cerrarModal();
        admin.render();
      };
    });
  };

  /** Ajuste rápido de stock de todo el catálogo, en una sola pantalla. */
  admin.reponerStock = function () {
    var ps = store.state.productos.slice().sort(function (a, b) {
      return (a.orden || 0) - (b.orden || 0);
    });

    var html =
      '<p style="color:var(--text-dim);font-size:.88rem">Escribe cuántas unidades tienes ahora de cada producto.</p>' +
      '<form id="formStock">' +
        ps.map(function (p) {
          return '<div style="display:grid;grid-template-columns:1fr 92px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)">' +
            '<label for="st_' + p.id + '" style="font-size:.9rem">' +
              U.escapeHtml(p.emoji || '') + ' ' + U.escapeHtml(p.nombre) +
            '</label>' +
            '<input id="st_' + p.id + '" name="' + p.id + '" type="number" inputmode="numeric" min="0" step="1" value="' + p.stock + '" ' +
              'style="width:100%;border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--surface);font-size:1rem">' +
          '</div>';
        }).join('') +
        '<button class="btn btn--block" type="submit" style="margin-top:16px">Guardar stock</button>' +
      '</form>';

    ui.modal('Reponer stock', html, function (body) {
      body.querySelector('#formStock').onsubmit = function (e) {
        e.preventDefault();
        ps.forEach(function (p) {
          var input = body.querySelector('#st_' + p.id);
          if (input) p.stock = Math.max(0, parseInt(input.value, 10) || 0);
        });
        store.commit();
        ui.cerrarModal();
        ui.toast('Stock actualizado');
        admin.render();
      };
    });
  };

  /* ═══════════════ Pestaña: pedidos ═══════════════ */

  admin.renderPedidos = function (cont) {
    var pedidos = store.state.pedidos;
    var hoy = new Date().toDateString();
    var deHoy = pedidos.filter(function (o) {
      return new Date(o.fecha).toDateString() === hoy && o.estado !== 'cancelado';
    });
    var ventasHoy = deHoy.reduce(function (a, o) { return a + o.total; }, 0);
    var porCobrar = pedidos.filter(function (o) { return o.estado === 'pendiente'; })
      .reduce(function (a, o) { return a + o.total; }, 0);

    cont.innerHTML =
      '<div class="stats">' +
        stat('Pedidos hoy', deHoy.length) +
        stat('Ventas hoy', U.money(ventasHoy)) +
        stat('Por cobrar', U.money(porCobrar)) +
        stat('Pedidos totales', pedidos.length) +
      '</div>' +
      (pedidos.length
        ? pedidos.map(filaPedido).join('')
        : '<p class="empty"><span aria-hidden="true">🧾</span>Aún no hay pedidos.</p>');

    Array.prototype.forEach.call(cont.querySelectorAll('[data-estado]'), function (sel) {
      sel.onchange = function () {
        store.cambiarEstadoPedido(sel.getAttribute('data-estado'), sel.value);
        ui.toast('Pedido actualizado');
        admin.render();
      };
    });
    Array.prototype.forEach.call(cont.querySelectorAll('[data-wa-cliente]'), function (b) {
      b.onclick = function () {
        var o = store.pedido(b.getAttribute('data-wa-cliente'));
        if (!o) return;
        var num = MD.checkout.telInternacional(o.cliente.telefono);
        var msg = 'Hola ' + o.cliente.nombre + ', soy ' + store.state.settings.nombre +
          '. Sobre tu pedido ' + o.codigo + ' por ' + U.money(o.total) + ': ';
        window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      };
    });
    Array.prototype.forEach.call(cont.querySelectorAll('[data-borrar-ped]'), function (b) {
      b.onclick = function () {
        ui.confirmar('Borrar pedido', 'Se elimina del historial. No devuelve el stock.', function () {
          store.borrarPedido(b.getAttribute('data-borrar-ped'));
          admin.render();
        }, 'Borrar');
      };
    });
  };

  function filaPedido(o) {
    var est = MD.ESTADOS[o.estado] || MD.ESTADOS.pendiente;
    var opciones = Object.keys(MD.ESTADOS).map(function (k) {
      return '<option value="' + k + '"' + (o.estado === k ? ' selected' : '') + '>' +
        MD.ESTADOS[k].label + '</option>';
    }).join('');

    return '' +
      '<article class="order">' +
        '<div class="order__head">' +
          '<div>' +
            '<div class="order__code">' + U.escapeHtml(o.codigo) + ' · ' +
              (o.pago === 'yappy' ? 'Yappy' : 'Efectivo') + '</div>' +
            '<div class="order__date">' + U.escapeHtml(U.fechaLarga(o.fecha)) + '</div>' +
          '</div>' +
          '<span class="tag ' + est.tag + '">' + est.label + '</span>' +
        '</div>' +
        '<div class="order__lines">' +
          '<b>' + U.escapeHtml(o.cliente.nombre) + '</b> · ' +
          U.escapeHtml(MD.checkout.telBonito(o.cliente.telefono)) + '<br>' +
          U.escapeHtml(o.cliente.direccion) +
          (o.cliente.nota ? '<br><i>Nota: ' + U.escapeHtml(o.cliente.nota) + '</i>' : '') +
          '<br>' + o.items.map(function (l) {
            return l.qty + '× ' + U.escapeHtml(l.nombre);
          }).join(' · ') +
        '</div>' +
        '<div class="order__foot">' +
          '<span class="order__total">' + U.money(o.total) + '</span>' +
          '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">' +
            '<select data-estado="' + o.id + '" style="border:1px solid var(--line);border-radius:10px;padding:7px 9px;background:var(--surface);font-size:.85rem">' +
              opciones +
            '</select>' +
            '<button class="btn btn--wa btn--sm" data-wa-cliente="' + o.id + '">WhatsApp</button>' +
            '<button class="btn btn--ghost btn--sm" data-borrar-ped="' + o.id + '">✕</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ═══════════════ Pestaña: ajustes ═══════════════ */

  admin.renderAjustes = function (cont) {
    var s = store.state.settings;

    cont.innerHTML =
      '<form id="formSet">' +
        '<div class="section-title">Tu negocio</div>' +
        '<label class="field"><span>Nombre</span>' +
          '<input name="nombre" maxlength="40" value="' + U.escapeHtml(s.nombre) + '"></label>' +
        '<label class="field"><span>Eslogan</span>' +
          '<input name="eslogan" maxlength="60" value="' + U.escapeHtml(s.eslogan) + '"></label>' +

        '<label class="switch">' +
          '<input type="checkbox" name="abierto"' + (s.abierto ? ' checked' : '') + '>' +
          '<span>Abierto ahora<small>Apágalo y nadie podrá confirmar pedidos</small></span>' +
        '</label>' +
        '<label class="field"><span>Mensaje cuando está cerrado</span>' +
          '<input name="mensajeCerrado" maxlength="90" value="' + U.escapeHtml(s.mensajeCerrado) + '"></label>' +

        '<div class="section-title">Cobros con Yappy</div>' +
        '<div class="row2">' +
          '<label class="field"><span>Número Yappy</span>' +
            '<input name="yappyNumero" type="tel" inputmode="tel" value="' + U.escapeHtml(s.yappyNumero) + '" placeholder="6123-4567">' +
            '<small>El celular asociado a tu Yappy.</small>' +
          '</label>' +
          '<label class="field"><span>Nombre en Yappy</span>' +
            '<input name="yappyNombre" maxlength="40" value="' + U.escapeHtml(s.yappyNombre) + '" placeholder="Juan P.">' +
            '<small>Para que el cliente confirme a quién le envía.</small>' +
          '</label>' +
        '</div>' +

        '<div class="field"><span>Tu código QR de Yappy (opcional)</span>' +
          '<input type="file" name="qr" accept="image/*">' +
          '<small>Sácale captura al QR desde tu app de Yappy y súbelo aquí. El cliente lo escanea y no tiene que teclear el número.</small>' +
          '<div id="previewQR" style="margin-top:9px">' +
            (s.yappyQR
              ? '<img src="' + U.escapeHtml(s.yappyQR) + '" alt="" style="width:110px;height:110px;object-fit:contain;border-radius:12px;background:#fff;padding:6px">' +
                '<button type="button" class="btn btn--ghost btn--sm" id="quitarQR" style="margin-left:10px">Quitar</button>'
              : '') +
          '</div>' +
          '<input type="hidden" name="yappyQR" value="' + U.escapeHtml(s.yappyQR) + '">' +
        '</div>' +

        '<label class="switch">' +
          '<input type="checkbox" name="aceptaEfectivo"' + (s.aceptaEfectivo ? ' checked' : '') + '>' +
          '<span>Aceptar también efectivo<small>Se cobra al entregar</small></span>' +
        '</label>' +

        '<div class="section-title">Contacto</div>' +
        '<label class="field"><span>WhatsApp del negocio</span>' +
          '<input name="whatsapp" type="tel" inputmode="tel" value="' + U.escapeHtml(s.whatsapp) + '" placeholder="6123-4567">' +
          '<small>Aquí te llegan los pedidos y los comprobantes de Yappy.</small>' +
        '</label>' +

        '<div class="section-title">Precios</div>' +
        '<div class="row2">' +
          '<label class="field"><span>Moneda</span>' +
            '<input name="moneda" maxlength="6" value="' + U.escapeHtml(s.moneda) + '"></label>' +
          '<label class="field"><span>Costo de entrega</span>' +
            '<input name="delivery" type="number" step="0.25" min="0" value="' + s.delivery + '">' +
            '<small>0 = entrega gratis</small>' +
          '</label>' +
        '</div>' +
        '<div class="row2">' +
          '<label class="field"><span>Pedido mínimo</span>' +
            '<input name="minimoPedido" type="number" step="0.5" min="0" value="' + s.minimoPedido + '">' +
            '<small>0 = sin mínimo</small>' +
          '</label>' +
          '<label class="field"><span>Tasa ITBMS (%)</span>' +
            '<input name="itbmsTasa" type="number" step="1" min="0" max="20" value="' + s.itbmsTasa + '"></label>' +
        '</div>' +
        '<label class="switch">' +
          '<input type="checkbox" name="itbmsActivo"' + (s.itbmsActivo ? ' checked' : '') + '>' +
          '<span>Cobrar ITBMS aparte<small>Déjalo apagado si tus precios ya lo incluyen</small></span>' +
        '</label>' +

        '<div class="section-title">Seguridad</div>' +
        '<label class="field"><span>PIN del panel</span>' +
          '<input name="pin" inputmode="numeric" maxlength="12" value="' + U.escapeHtml(s.pin) + '">' +
          '<small>Sólo evita toques accidentales. No es seguridad real.</small>' +
        '</label>' +

        '<button class="btn btn--block" type="submit">Guardar ajustes</button>' +
      '</form>';

    var form = cont.querySelector('#formSet');
    var prevQR = cont.querySelector('#previewQR');

    function conectarQuitarQR() {
      var q = cont.querySelector('#quitarQR');
      if (q) q.onclick = function () { form.yappyQR.value = ''; prevQR.innerHTML = ''; };
    }
    conectarQuitarQR();

    form.qr.onchange = function () {
      var f = form.qr.files && form.qr.files[0];
      if (!f) return;
      prevQR.innerHTML = '<small style="color:var(--text-dim)">Procesando…</small>';
      // El QR se guarda más grande y con más calidad: tiene que poder escanearse.
      comprimirImagen(f, 640, 0.92).then(function (dataUrl) {
        form.yappyQR.value = dataUrl;
        prevQR.innerHTML =
          '<img src="' + dataUrl + '" alt="" style="width:110px;height:110px;object-fit:contain;border-radius:12px;background:#fff;padding:6px">' +
          '<button type="button" class="btn btn--ghost btn--sm" id="quitarQR" style="margin-left:10px">Quitar</button>';
        conectarQuitarQR();
      }).catch(function (err) {
        prevQR.innerHTML = '';
        ui.toast(err.message, 'err');
      });
    };

    form.onsubmit = function (e) {
      e.preventDefault();
      store.guardarSettings({
        nombre: form.nombre.value.trim() || 'MovilDrink',
        eslogan: form.eslogan.value.trim(),
        abierto: form.abierto.checked,
        mensajeCerrado: form.mensajeCerrado.value.trim(),
        yappyNumero: form.yappyNumero.value.trim(),
        yappyNombre: form.yappyNombre.value.trim(),
        yappyQR: form.yappyQR.value,
        aceptaEfectivo: form.aceptaEfectivo.checked,
        whatsapp: form.whatsapp.value.trim(),
        moneda: form.moneda.value.trim() || 'B/.',
        delivery: Math.max(0, parseFloat(form.delivery.value) || 0),
        minimoPedido: Math.max(0, parseFloat(form.minimoPedido.value) || 0),
        itbmsTasa: Math.max(0, parseFloat(form.itbmsTasa.value) || 0),
        itbmsActivo: form.itbmsActivo.checked,
        pin: form.pin.value.trim() || '1234'
      });
      ui.toast('Ajustes guardados');
      admin.render();
    };
  };

  /* ═══════════════ Pestaña: respaldo ═══════════════ */

  admin.renderRespaldo = function (cont) {
    cont.innerHTML =
      '<div class="note">' +
        'MovilDrink guarda todo <b>en este dispositivo</b>. Si borras los datos del navegador ' +
        'o cambias de teléfono, se pierde. Descarga un respaldo de vez en cuando.' +
      '</div>' +
      '<div class="adminbar">' +
        '<button class="btn btn--sm" id="btnExport">Descargar respaldo</button>' +
        '<button class="btn btn--ghost btn--sm" id="btnImport">Restaurar respaldo</button>' +
      '</div>' +
      '<input type="file" id="fileImport" accept="application/json,.json" hidden>' +

      '<div class="section-title">Reportes</div>' +
      '<div class="adminbar">' +
        '<button class="btn btn--ghost btn--sm" id="btnCsv">Exportar ventas (CSV)</button>' +
      '</div>' +

      '<div class="section-title">Zona peligrosa</div>' +
      '<button class="btn btn--danger btn--sm" id="btnReset">Borrar todo y empezar de cero</button>';

    cont.querySelector('#btnExport').onclick = function () {
      descargar('movildrink-respaldo-' + fechaArchivo() + '.json',
        store.exportar(), 'application/json');
      ui.toast('Respaldo descargado');
    };

    var file = cont.querySelector('#fileImport');
    cont.querySelector('#btnImport').onclick = function () { file.click(); };
    file.onchange = function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          store.importar(r.result);
          ui.toast('Respaldo restaurado');
          admin.render();
          MD.ui.render();
        } catch (err) {
          ui.toast(err.message || 'Archivo inválido', 'err');
        }
        file.value = '';
      };
      r.readAsText(f);
    };

    cont.querySelector('#btnCsv').onclick = function () {
      descargar('movildrink-ventas-' + fechaArchivo() + '.csv', ventasCsv(), 'text/csv');
      ui.toast('CSV descargado');
    };

    cont.querySelector('#btnReset').onclick = function () {
      ui.confirmar('Borrar todo',
        'Se borran productos, pedidos y ajustes, y vuelve el catálogo de ejemplo. Esto no se puede deshacer.',
        function () {
          store.reiniciar();
          admin.render();
          MD.ui.render();
          ui.toast('Todo reiniciado');
        }, 'Sí, borrar todo');
    };
  };

  function fechaArchivo() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /** Una fila por línea de pedido: sirve para abrirlo en Excel. */
  function ventasCsv() {
    var campo = function (v) {
      var s = String(v == null ? '' : v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    var filas = [['Codigo', 'Fecha', 'Cliente', 'Telefono', 'Pago', 'Estado',
                  'Producto', 'Cantidad', 'Precio', 'Subtotal', 'Total pedido'].join(',')];
    store.state.pedidos.forEach(function (o) {
      o.items.forEach(function (l) {
        filas.push([
          campo(o.codigo), campo(U.fechaLarga(o.fecha)), campo(o.cliente.nombre),
          campo(o.cliente.telefono), campo(o.pago), campo(o.estado),
          campo(l.nombre), l.qty, l.precio.toFixed(2), l.subtotal.toFixed(2), o.total.toFixed(2)
        ].join(','));
      });
    });
    // BOM para que Excel en Windows lea bien los acentos.
    return String.fromCharCode(0xFEFF) + filas.join('\r\n');
  }

  function descargar(nombre, contenido, tipo) {
    var blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  MD.admin = admin;
})();
