/* ═══════════════════════════════════════════════════════════
   Estado global de MovilDrink.

   `datos` (productos, pedidos, ajustes, cliente) se guarda en
   localStorage. El `carrito` vive sólo en memoria a propósito: al
   recargar se vacía, como en cualquier tienda.
   ═══════════════════════════════════════════════════════════ */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  STORAGE_KEY, VERSION, DEFAULT_SETTINGS, SEED_PRODUCTOS,
} from '../data/seed.js'
import { uid, round2, orderCode, calcularTotales, money as fmtMoney } from '../lib/format.js'
import { enviarTelegram, mensajePedido, telegramListo } from '../lib/telegram.js'

const StoreContext = createContext(null)

/** Recuerda qué versión del catálogo publicado ya aplicó este aparato. */
const CATALOGO_KEY = 'movildrink.catalogoVersion'

/* ─────────────── Estado inicial y carga ─────────────── */

function productosSemilla() {
  return SEED_PRODUCTOS.map((p, i) => ({
    id: uid('p'),
    nombre: p.nombre,
    cat: p.cat,
    precio: round2(p.precio),
    stock: p.stock,
    emoji: p.emoji,
    img: '',
    desc: p.desc || '',
    activo: true,
    orden: i,
  }))
}

function estadoInicial() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    productos: productosSemilla(),
    pedidos: [],
    cliente: { nombre: '', telefono: '', direccion: '' },
    meta: { version: VERSION, creado: new Date().toISOString() },
  }
}

/** Mezcla lo guardado con la forma actual, para que un respaldo viejo no rompa nada. */
function normalizar(data) {
  const base = estadoInicial()
  return {
    settings: { ...base.settings, ...(data.settings || {}) },
    productos: Array.isArray(data.productos) ? data.productos : base.productos,
    pedidos: Array.isArray(data.pedidos) ? data.pedidos : [],
    cliente: { ...base.cliente, ...(data.cliente || {}) },
    meta: { ...base.meta, ...(data.meta || {}) },
  }
}

function cargar() {
  let raw
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch (e) {
    // Safari en modo privado puede bloquear localStorage por completo.
    console.warn('[MovilDrink] localStorage no disponible:', e)
    return estadoInicial()
  }
  if (!raw) return estadoInicial()
  try {
    return normalizar(JSON.parse(raw))
  } catch (e) {
    console.warn('[MovilDrink] datos corruptos, se reinicia:', e)
    return estadoInicial()
  }
}

/* ─────────────── Provider ─────────────── */

export function StoreProvider({ children }) {
  const [datos, setDatos] = useState(cargar)
  const [carrito, setCarrito] = useState([])       // [{ id, qty }]
  const [avisos, setAvisos] = useState([])         // toasts
  const contadorAviso = useRef(0)

  /* --- persistencia --- */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datos))
    } catch (e) {
      console.warn('[MovilDrink] no se pudo guardar:', e)
    }
  }, [datos])

  /* --- catálogo publicado --------------------------------------------
     Si junto a la app hay un `catalogo.json` (el que exportas desde el
     panel), manda ése. Sin esto, cada cliente que abre el enlace vería
     el catálogo de ejemplo en vez del tuyo, porque los datos viven en
     el navegador de cada dispositivo.

     Se aplica cuando la versión publicada es distinta de la última que
     este aparato aplicó, así que republicar actualiza a todos. Los
     pedidos ya hechos y el PIN local nunca se tocan. ------------------ */
  useEffect(() => {
    let cancelado = false

    fetch(`${import.meta.env.BASE_URL}catalogo.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((cat) => {
        if (cancelado || !cat || !Array.isArray(cat.productos)) return

        let aplicada = null
        try {
          aplicada = localStorage.getItem(CATALOGO_KEY)
        } catch { /* sin localStorage: se aplica igual, en memoria */ }

        if (aplicada === String(cat.version)) return

        setDatos((d) => ({
          ...d,
          productos: cat.productos,
          // El PIN es del dueño de este aparato y no viaja en el archivo.
          settings: { ...d.settings, ...(cat.settings || {}), pin: d.settings.pin },
        }))

        try {
          localStorage.setItem(CATALOGO_KEY, String(cat.version))
        } catch { /* da igual: se reaplicará en la próxima visita */ }
      })
      .catch(() => {
        // Sin catalogo.json (o sin internet) se usa lo que ya hay guardado.
      })

    return () => {
      cancelado = true
    }
  }, [])

  /* --- avisos --- */
  const toast = useCallback((mensaje, tipo = 'ok') => {
    const id = ++contadorAviso.current
    setAvisos((a) => [...a, { id, mensaje, tipo }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === 'err' ? 3400 : 2300)
  }, [])

  const money = useCallback((n) => fmtMoney(n, datos.settings.moneda), [datos.settings.moneda])

  /* ─────────────── Productos ─────────────── */

  const producto = useCallback(
    (id) => datos.productos.find((p) => p.id === id) || null,
    [datos.productos]
  )

  const productosVisibles = useMemo(
    () => datos.productos.filter((p) => p.activo),
    [datos.productos]
  )

  const agregarProducto = useCallback((campos) => {
    const nuevo = {
      id: uid('p'),
      nombre: 'Producto',
      cat: 'bebidas',
      precio: 0,
      stock: 0,
      emoji: '🥤',
      img: '',
      desc: '',
      activo: true,
      ...campos,
    }
    nuevo.precio = round2(nuevo.precio)
    nuevo.stock = Math.max(0, parseInt(nuevo.stock, 10) || 0)
    setDatos((d) => ({
      ...d,
      productos: [...d.productos, { ...nuevo, orden: d.productos.length }],
    }))
    return nuevo
  }, [])

  const actualizarProducto = useCallback((id, campos) => {
    setDatos((d) => ({
      ...d,
      productos: d.productos.map((p) => {
        if (p.id !== id) return p
        const act = { ...p, ...campos }
        act.precio = round2(act.precio)
        act.stock = Math.max(0, parseInt(act.stock, 10) || 0)
        return act
      }),
    }))
    // Si el stock bajó de lo que ya había en el carrito, recorta la línea.
    setCarrito((c) =>
      c.map((l) => {
        if (l.id !== id) return l
        const nuevoStock = Math.max(0, parseInt(campos.stock, 10) || 0)
        return { ...l, qty: Math.min(l.qty, nuevoStock) }
      }).filter((l) => l.qty > 0)
    )
  }, [])

  const borrarProducto = useCallback((id) => {
    setDatos((d) => ({ ...d, productos: d.productos.filter((p) => p.id !== id) }))
    setCarrito((c) => c.filter((l) => l.id !== id))
  }, [])

  /** Sube o baja un producto en el orden del catálogo. dir = -1 | 1 */
  const moverProducto = useCallback((id, dir) => {
    setDatos((d) => {
      const lista = [...d.productos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      const i = lista.findIndex((p) => p.id === id)
      const j = i + dir
      if (i === -1 || j < 0 || j >= lista.length) return d
      ;[lista[i], lista[j]] = [lista[j], lista[i]]
      return { ...d, productos: lista.map((p, k) => ({ ...p, orden: k })) }
    })
  }, [])

  /** Reponer stock: { idProducto: cantidad } de una sola pasada. */
  const fijarStockMasivo = useCallback((mapa) => {
    setDatos((d) => ({
      ...d,
      productos: d.productos.map((p) =>
        mapa[p.id] === undefined ? p : { ...p, stock: Math.max(0, parseInt(mapa[p.id], 10) || 0) }
      ),
    }))
  }, [])

  /* ─────────────── Carrito ─────────────── */

  const cantidadEnCarrito = useCallback(
    (id) => carrito.find((l) => l.id === id)?.qty ?? 0,
    [carrito]
  )

  /** Suma `delta` unidades sin pasar nunca del stock disponible. */
  const agregarAlCarrito = useCallback(
    (id, delta = 1) => {
      const p = datos.productos.find((x) => x.id === id)
      if (!p || !p.activo) return

      setCarrito((c) => {
        const linea = c.find((l) => l.id === id)
        const actual = linea?.qty ?? 0
        let nueva = actual + delta

        if (nueva <= 0) return c.filter((l) => l.id !== id)

        if (nueva > p.stock) {
          if (actual >= p.stock) {
            toast(`Sólo quedan ${p.stock} de ${p.nombre}`, 'err')
            return c
          }
          nueva = p.stock
        }
        return linea
          ? c.map((l) => (l.id === id ? { ...l, qty: nueva } : l))
          : [...c, { id, qty: nueva }]
      })
    },
    [datos.productos, toast]
  )

  const quitarDelCarrito = useCallback((id) => {
    setCarrito((c) => c.filter((l) => l.id !== id))
  }, [])

  const vaciarCarrito = useCallback(() => setCarrito([]), [])

  /** Líneas del carrito enriquecidas con los datos actuales del producto. */
  const lineasCarrito = useMemo(() => {
    return carrito
      .map((l) => {
        const p = datos.productos.find((x) => x.id === l.id)
        if (!p) return null
        return {
          id: p.id,
          nombre: p.nombre,
          emoji: p.emoji,
          img: p.img,
          precio: p.precio,
          stock: p.stock,
          qty: l.qty,
        }
      })
      .filter(Boolean)
  }, [carrito, datos.productos])

  const totales = useMemo(
    () => calcularTotales(lineasCarrito, datos.settings),
    [lineasCarrito, datos.settings]
  )

  /* ─────────────── Pedidos ─────────────── */

  const crearPedido = useCallback(
    (form) => {
      const t = calcularTotales(lineasCarrito, datos.settings)
      const pedido = {
        id: uid('o'),
        codigo: orderCode(),
        fecha: new Date().toISOString(),
        cliente: {
          // Nombre y celular son opcionales: la venta es cara a cara en el
          // auto. Si no los da, queda como "Cliente" para poder listarlo.
          nombre: (form.nombre || '').trim(),
          telefono: (form.telefono || '').trim(),
          nota: form.nota || '',
        },
        pago: form.pago,                      // 'yappy' | 'efectivo'
        items: t.items.map((l) => ({
          id: l.id, nombre: l.nombre, precio: l.precio, qty: l.qty, subtotal: l.subtotal,
        })),
        subtotal: t.subtotal,
        itbms: t.itbms,
        envio: t.envio,
        total: t.total,
        // Todo pedido nace pendiente; el vendedor lo mueve desde su panel.
        estado: 'pendiente',
        // null = sin intentar todavía · true = avisado · false = falló
        avisado: telegramListo(datos.settings) ? null : undefined,
      }

      setDatos((d) => ({
        ...d,
        // Descuenta el stock al confirmar.
        productos: d.productos.map((p) => {
          const l = pedido.items.find((x) => x.id === p.id)
          return l ? { ...p, stock: Math.max(0, p.stock - l.qty) } : p
        }),
        // Recuerda los datos para el próximo pedido.
        cliente: {
          nombre: (form.nombre || '').trim(),
          telefono: (form.telefono || '').trim(),
          direccion: '',
        },
        pedidos: [pedido, ...d.pedidos],
      }))
      setCarrito([])

      // Aviso por Telegram. Sin await a propósito: si Telegram tarda o
      // falla, el cliente no se queda esperando ni ve un error que no le
      // corresponde. El resultado se guarda en el pedido para que puedas
      // reenviarlo desde el panel.
      if (telegramListo(datos.settings)) {
        const texto = mensajePedido(pedido, datos.settings, (n) =>
          fmtMoney(n, datos.settings.moneda)
        )
        enviarTelegram(datos.settings, texto).then(({ ok, error }) => {
          if (!ok) console.warn('[MovilDrink] Telegram falló:', error)
          setDatos((d) => ({
            ...d,
            pedidos: d.pedidos.map((o) => (o.id === pedido.id ? { ...o, avisado: ok } : o)),
          }))
        })
      }

      return pedido
    },
    [lineasCarrito, datos.settings]
  )

  const pedido = useCallback((id) => datos.pedidos.find((o) => o.id === id) || null, [datos.pedidos])

  const cambiarEstadoPedido = useCallback((id, estado) => {
    setDatos((d) => {
      const o = d.pedidos.find((x) => x.id === id)
      if (!o) return d
      // Cancelar devuelve al inventario lo que se había reservado.
      const devolver = estado === 'cancelado' && o.estado !== 'cancelado'
      return {
        ...d,
        productos: devolver
          ? d.productos.map((p) => {
              const l = o.items.find((x) => x.id === p.id)
              return l ? { ...p, stock: p.stock + l.qty } : p
            })
          : d.productos,
        pedidos: d.pedidos.map((x) => (x.id === id ? { ...x, estado } : x)),
      }
    })
  }, [])

  const borrarPedido = useCallback((id) => {
    setDatos((d) => ({ ...d, pedidos: d.pedidos.filter((o) => o.id !== id) }))
  }, [])

  /** Reintenta el aviso de Telegram de un pedido que no llegó. */
  const reenviarAviso = useCallback(
    async (id) => {
      const o = datos.pedidos.find((x) => x.id === id)
      if (!o) return { ok: false, error: 'Pedido no encontrado' }

      const texto = mensajePedido(o, datos.settings, (n) => fmtMoney(n, datos.settings.moneda))
      const res = await enviarTelegram(datos.settings, texto)

      setDatos((d) => ({
        ...d,
        pedidos: d.pedidos.map((x) => (x.id === id ? { ...x, avisado: res.ok } : x)),
      }))
      return res
    },
    [datos.pedidos, datos.settings]
  )

  /* ─────────────── Ajustes ─────────────── */

  const guardarSettings = useCallback((campos) => {
    setDatos((d) => ({ ...d, settings: { ...d.settings, ...campos } }))
  }, [])

  /* ─────────────── Respaldo ─────────────── */

  const exportar = useCallback(
    () => JSON.stringify({ app: 'MovilDrink', version: VERSION, exportado: new Date().toISOString(), state: datos }, null, 2),
    [datos]
  )

  /**
   * Catálogo para publicar junto a la app: es lo que verán los clientes
   * al abrir el enlace por primera vez.
   *
   * Va sin pedidos (son privados) y sin el PIN. `version` cambia en cada
   * exportación, así los aparatos con el catálogo viejo se actualizan solos.
   *
   * El token de Telegram SÍ va incluido, y es a propósito: el aviso de
   * venta lo manda el celular del cliente, así que necesita tenerlo. Es el
   * precio de no tener servidor propio.
   */
  const exportarCatalogo = useCallback(() => {
    const { pin, ...settingsPublicas } = datos.settings
    return JSON.stringify(
      {
        app: 'MovilDrink',
        tipo: 'catalogo',
        version: new Date().toISOString(),
        settings: settingsPublicas,
        productos: datos.productos,
      },
      null,
      2
    )
  }, [datos])

  const importar = useCallback((json) => {
    const data = JSON.parse(json)
    const s = data.state || data
    if (!s || !Array.isArray(s.productos)) {
      throw new Error('El archivo no parece un respaldo de MovilDrink.')
    }
    setDatos(normalizar(s))
    setCarrito([])
  }, [])

  const reiniciar = useCallback(() => {
    setDatos(estadoInicial())
    setCarrito([])
  }, [])

  /* ─────────────── Valor del contexto ─────────────── */

  const valor = useMemo(
    () => ({
      settings: datos.settings,
      productos: datos.productos,
      pedidos: datos.pedidos,
      cliente: datos.cliente,
      productosVisibles,
      producto,
      agregarProducto, actualizarProducto, borrarProducto, moverProducto, fijarStockMasivo,
      carrito, lineasCarrito, totales,
      cantidadEnCarrito, agregarAlCarrito, quitarDelCarrito, vaciarCarrito,
      crearPedido, pedido, cambiarEstadoPedido, borrarPedido, reenviarAviso,
      guardarSettings,
      exportar, exportarCatalogo, importar, reiniciar,
      money, toast, avisos,
    }),
    [
      datos, productosVisibles, producto,
      agregarProducto, actualizarProducto, borrarProducto, moverProducto, fijarStockMasivo,
      carrito, lineasCarrito, totales,
      cantidadEnCarrito, agregarAlCarrito, quitarDelCarrito, vaciarCarrito,
      crearPedido, pedido, cambiarEstadoPedido, borrarPedido, reenviarAviso,
      guardarSettings, exportar, exportarCatalogo, importar, reiniciar, money, toast, avisos,
    ]
  )

  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>
}

/** Acceso al store desde cualquier componente. */
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>')
  return ctx
}
