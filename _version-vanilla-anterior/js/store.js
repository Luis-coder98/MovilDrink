/* ═══════════════════════════════════════════════════════════
   MovilDrink · store.js
   Estado de la app + persistencia en localStorage.
   No hay servidor: todo vive en el dispositivo. Por eso el panel
   del vendedor incluye Exportar/Importar respaldo.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var KEY = MD.STORAGE_KEY;

  /* ---------- utilidades ---------- */

  function uid(prefix) {
    return (prefix || 'id') + '_' +
      Math.random().toString(36).slice(2, 8) +
      Date.now().toString(36).slice(-4);
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  /** Redondeo a 2 decimales sin errores de coma flotante. */
  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  /** Formatea un monto con la moneda configurada: "B/. 12.50" */
  function money(n) {
    var m = (MD.store && MD.store.state.settings.moneda) || 'B/.';
    var v = round2(Number(n) || 0);
    return m + ' ' + v.toFixed(2);
  }

  /**
   * Quita acentos y pasa a minúsculas, para que "cafe" encuentre "café".
   * Filtra los diacríticos combinantes (U+0300–U+036F) recorriendo la
   * cadena en vez de con una regex, para no depender de la codificación
   * del archivo fuente.
   */
  function norm(s) {
    var src = String(s || '').toLowerCase();
    src = src.normalize ? src.normalize('NFD') : src;
    var out = '';
    for (var i = 0; i < src.length; i++) {
      var c = src.charCodeAt(i);
      if (c < 0x300 || c > 0x36f) out += src.charAt(i);
    }
    return out;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Código legible de pedido: MD-260816-A4K */
  function orderCode(date) {
    var d = date || new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    var ymd = String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate());
    var rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
    return 'MD-' + ymd + '-' + rnd;
  }

  function fechaLarga(iso) {
    try {
      return new Date(iso).toLocaleString('es-PA', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  /* ---------- estado inicial ---------- */

  function seedProductos() {
    return MD.SEED_PRODUCTOS.map(function (p, i) {
      return {
        id: uid('p'),
        nombre: p.nombre,
        cat: p.cat,
        precio: round2(p.precio),
        stock: p.stock,
        emoji: p.emoji,
        img: '',
        desc: p.desc || '',
        activo: true,
        orden: i
      };
    });
  }

  function estadoInicial() {
    return {
      settings: clone(MD.DEFAULT_SETTINGS),
      productos: seedProductos(),
      pedidos: [],
      cliente: { nombre: '', telefono: '', direccion: '' },
      meta: { version: MD.VERSION, creado: new Date().toISOString() }
    };
  }

  /* ---------- carga / guardado ---------- */

  function cargar() {
    var raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      // Modo privado de Safari puede bloquear localStorage.
      console.warn('[MovilDrink] localStorage no disponible:', e);
      return estadoInicial();
    }
    if (!raw) return estadoInicial();

    try {
      var data = JSON.parse(raw);
      var base = estadoInicial();
      // Mezcla superficial para que las claves nuevas de settings
      // aparezcan aunque el respaldo sea de una versión anterior.
      return {
        settings:  Object.assign({}, base.settings, data.settings || {}),
        productos: Array.isArray(data.productos) ? data.productos : base.productos,
        pedidos:   Array.isArray(data.pedidos)   ? data.pedidos   : [],
        cliente:   Object.assign({}, base.cliente, data.cliente || {}),
        meta:      Object.assign({}, base.meta, data.meta || {})
      };
    } catch (e) {
      console.warn('[MovilDrink] datos corruptos, se reinicia:', e);
      return estadoInicial();
    }
  }

  /* ---------- store ---------- */

  var listeners = [];

  var store = {
    state: cargar(),

    /** El carrito vive en memoria: se pierde al recargar, a propósito. */
    cart: [],

    guardar: function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn('[MovilDrink] no se pudo guardar:', e);
        if (MD.ui && MD.ui.toast) {
          MD.ui.toast('No se pudo guardar. ¿Almacenamiento lleno?', 'err');
        }
      }
    },

    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (f) { return f !== fn; });
      };
    },

    emit: function () {
      listeners.forEach(function (fn) {
        try { fn(store.state); } catch (e) { console.error(e); }
      });
    },

    /** Guarda y notifica: el patrón normal tras cualquier cambio. */
    commit: function () {
      this.guardar();
      this.emit();
    },

    /* ---- productos ---- */

    producto: function (id) {
      return this.state.productos.find(function (p) { return p.id === id; }) || null;
    },

    productosVisibles: function () {
      return this.state.productos.filter(function (p) { return p.activo; });
    },

    agregarProducto: function (datos) {
      var p = Object.assign({
        id: uid('p'),
        nombre: 'Producto',
        cat: 'bebidas',
        precio: 0,
        stock: 0,
        emoji: '🥤',
        img: '',
        desc: '',
        activo: true,
        orden: this.state.productos.length
      }, datos);
      p.precio = round2(p.precio);
      p.stock = Math.max(0, parseInt(p.stock, 10) || 0);
      this.state.productos.push(p);
      this.commit();
      return p;
    },

    actualizarProducto: function (id, datos) {
      var p = this.producto(id);
      if (!p) return null;
      Object.assign(p, datos);
      p.precio = round2(p.precio);
      p.stock = Math.max(0, parseInt(p.stock, 10) || 0);
      // Si el stock cayó por debajo de lo que hay en el carrito, ajusta.
      var linea = store.cart.find(function (l) { return l.id === id; });
      if (linea && linea.qty > p.stock) {
        linea.qty = p.stock;
        if (linea.qty <= 0) store.quitarDelCarrito(id, true);
      }
      this.commit();
      return p;
    },

    borrarProducto: function (id) {
      this.state.productos = this.state.productos.filter(function (p) { return p.id !== id; });
      this.quitarDelCarrito(id, true);
      this.commit();
    },

    /* ---- carrito ---- */

    lineaCarrito: function (id) {
      return this.cart.find(function (l) { return l.id === id; }) || null;
    },

    cantidadEnCarrito: function (id) {
      var l = this.lineaCarrito(id);
      return l ? l.qty : 0;
    },

    /**
     * Suma `delta` unidades al carrito. Devuelve true si cambió algo.
     * Nunca deja pasar del stock disponible.
     */
    agregarAlCarrito: function (id, delta) {
      var p = this.producto(id);
      if (!p || !p.activo) return false;

      var d = delta == null ? 1 : delta;
      var linea = this.lineaCarrito(id);
      var actual = linea ? linea.qty : 0;
      var nueva = actual + d;

      if (nueva <= 0) {
        this.quitarDelCarrito(id);
        return true;
      }
      if (nueva > p.stock) {
        if (actual >= p.stock) {
          MD.ui.toast('Sólo quedan ' + p.stock + ' de ' + p.nombre, 'err');
          return false;
        }
        nueva = p.stock;
      }

      if (linea) {
        linea.qty = nueva;
      } else {
        this.cart.push({ id: id, qty: nueva });
      }
      this.emit();
      return true;
    },

    quitarDelCarrito: function (id, silencioso) {
      this.cart = this.cart.filter(function (l) { return l.id !== id; });
      if (!silencioso) this.emit();
    },

    vaciarCarrito: function () {
      this.cart = [];
      this.emit();
    },

    /** Líneas del carrito enriquecidas con los datos del producto. */
    carritoDetallado: function () {
      var self = this;
      return this.cart.map(function (l) {
        var p = self.producto(l.id);
        if (!p) return null;
        return {
          id: p.id,
          nombre: p.nombre,
          emoji: p.emoji,
          img: p.img,
          precio: p.precio,
          stock: p.stock,
          qty: l.qty,
          subtotal: round2(p.precio * l.qty)
        };
      }).filter(Boolean);
    },

    /** Subtotal, ITBMS, entrega y total del carrito actual. */
    totales: function () {
      var s = this.state.settings;
      var items = this.carritoDetallado();
      var subtotal = round2(items.reduce(function (a, l) { return a + l.subtotal; }, 0));
      var unidades = items.reduce(function (a, l) { return a + l.qty; }, 0);
      var itbms = s.itbmsActivo ? round2(subtotal * (Number(s.itbmsTasa) || 0) / 100) : 0;
      var envio = items.length ? round2(Number(s.delivery) || 0) : 0;
      return {
        items: items,
        unidades: unidades,
        subtotal: subtotal,
        itbms: itbms,
        envio: envio,
        total: round2(subtotal + itbms + envio)
      };
    },

    /* ---- pedidos ---- */

    crearPedido: function (datos) {
      var t = this.totales();
      var pedido = {
        id: uid('o'),
        codigo: orderCode(),
        fecha: new Date().toISOString(),
        cliente: {
          nombre: datos.nombre,
          telefono: datos.telefono,
          direccion: datos.direccion,
          nota: datos.nota || ''
        },
        pago: datos.pago,                    // 'yappy' | 'efectivo'
        entrega: datos.entrega || 'delivery',// 'delivery' | 'punto'
        items: t.items.map(function (l) {
          return { id: l.id, nombre: l.nombre, precio: l.precio, qty: l.qty, subtotal: l.subtotal };
        }),
        subtotal: t.subtotal,
        itbms: t.itbms,
        envio: t.envio,
        total: t.total,
        // Todo pedido nace pendiente; el vendedor lo mueve desde su panel.
        estado: 'pendiente'
      };

      // Descuenta stock al confirmar el pedido.
      var self = this;
      pedido.items.forEach(function (l) {
        var p = self.producto(l.id);
        if (p) p.stock = Math.max(0, p.stock - l.qty);
      });

      // Recuerda los datos del cliente para el próximo pedido.
      this.state.cliente = {
        nombre: datos.nombre,
        telefono: datos.telefono,
        direccion: datos.direccion
      };

      this.state.pedidos.unshift(pedido);
      this.cart = [];
      this.commit();
      return pedido;
    },

    pedido: function (id) {
      return this.state.pedidos.find(function (o) { return o.id === id; }) || null;
    },

    cambiarEstadoPedido: function (id, estado) {
      var o = this.pedido(id);
      if (!o) return;
      // Al cancelar, devuelve el stock reservado.
      if (estado === 'cancelado' && o.estado !== 'cancelado') {
        var self = this;
        o.items.forEach(function (l) {
          var p = self.producto(l.id);
          if (p) p.stock += l.qty;
        });
      }
      o.estado = estado;
      this.commit();
    },

    borrarPedido: function (id) {
      this.state.pedidos = this.state.pedidos.filter(function (o) { return o.id !== id; });
      this.commit();
    },

    /* ---- ajustes ---- */

    guardarSettings: function (datos) {
      Object.assign(this.state.settings, datos);
      this.commit();
    },

    /* ---- respaldo ---- */

    exportar: function () {
      return JSON.stringify({
        app: 'MovilDrink',
        version: MD.VERSION,
        exportado: new Date().toISOString(),
        state: this.state
      }, null, 2);
    },

    importar: function (json) {
      var data = JSON.parse(json);
      var s = data.state || data;
      if (!s || !Array.isArray(s.productos)) {
        throw new Error('El archivo no parece un respaldo de MovilDrink.');
      }
      var base = estadoInicial();
      this.state = {
        settings:  Object.assign({}, base.settings, s.settings || {}),
        productos: s.productos,
        pedidos:   Array.isArray(s.pedidos) ? s.pedidos : [],
        cliente:   Object.assign({}, base.cliente, s.cliente || {}),
        meta:      Object.assign({}, base.meta, s.meta || {})
      };
      this.cart = [];
      this.commit();
    },

    reiniciar: function () {
      this.state = estadoInicial();
      this.cart = [];
      this.commit();
    }
  };

  /* ---------- exporta ---------- */
  MD.store = store;
  MD.util = {
    uid: uid,
    clone: clone,
    round2: round2,
    money: money,
    norm: norm,
    escapeHtml: escapeHtml,
    orderCode: orderCode,
    fechaLarga: fechaLarga
  };
})();
