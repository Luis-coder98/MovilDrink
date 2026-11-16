/* ═══════════════════════════════════════════════════════════
   Funciones puras de formato y cálculo.
   Sin React ni DOM: fáciles de probar y de reutilizar.
   ═══════════════════════════════════════════════════════════ */

/** Id corto y único, con prefijo para poder leerlo de un vistazo. */
export function uid(prefijo = 'id') {
  return `${prefijo}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

/** Redondeo a 2 decimales sin los errores clásicos de coma flotante. */
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/** "B/. 12.50" — la moneda sale de los ajustes. */
export function money(n, moneda = 'B/.') {
  return `${moneda} ${round2(Number(n) || 0).toFixed(2)}`
}

/**
 * Minúsculas y sin acentos, para que "cafe" encuentre "Café".
 * Filtra los diacríticos combinantes (U+0300–U+036F) recorriendo la
 * cadena, sin depender de la codificación del archivo fuente.
 */
export function norm(s) {
  const src = String(s ?? '').toLowerCase().normalize('NFD')
  let out = ''
  for (let i = 0; i < src.length; i++) {
    const c = src.charCodeAt(i)
    if (c < 0x300 || c > 0x36f) out += src[i]
  }
  return out
}

/** Código legible de pedido: MD-260816-A4K */
export function orderCode(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  const ymd = String(date.getFullYear()).slice(2) + p(date.getMonth() + 1) + p(date.getDate())
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `MD-${ymd}-${rnd}`
}

export function fechaLarga(iso) {
  try {
    return new Date(iso).toLocaleString('es-PA', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}

export function fechaArchivo(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/* ─────────────── Teléfonos panameños ─────────────── */

export function soloDigitos(s) {
  return String(s ?? '').replace(/\D+/g, '')
}

/**
 * A formato internacional para wa.me: 507XXXXXXXX.
 * Acepta '6123-4567', '+507 6123 4567' y '50761234567'.
 */
export function telInternacional(s) {
  const d = soloDigitos(s)
  if (!d) return ''
  if (d.startsWith('507') && d.length >= 10) return d
  if (d.length === 8) return `507${d}`
  return d
}

/** Para mostrar: 6123-4567 */
export function telBonito(s) {
  let d = soloDigitos(s)
  if (d.startsWith('507') && d.length === 11) d = d.slice(3)
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4)}`
  if (d.length === 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return String(s ?? '')
}

/** Celulares y fijos de Panamá: 8 o 7 dígitos. */
export function validaTelPanama(s) {
  let d = soloDigitos(s)
  if (d.startsWith('507')) d = d.slice(3)
  return d.length === 7 || d.length === 8
}

/* ─────────────── Totales ─────────────── */

/**
 * Calcula el pedido completo a partir de las líneas del carrito.
 * `lineas` = [{ precio, qty, ... }]
 */
export function calcularTotales(lineas, settings) {
  const items = lineas.map((l) => ({ ...l, subtotal: round2(l.precio * l.qty) }))
  const subtotal = round2(items.reduce((a, l) => a + l.subtotal, 0))
  const unidades = items.reduce((a, l) => a + l.qty, 0)
  const itbms = settings.itbmsActivo
    ? round2((subtotal * (Number(settings.itbmsTasa) || 0)) / 100)
    : 0
  const envio = items.length ? round2(Number(settings.delivery) || 0) : 0
  return { items, unidades, subtotal, itbms, envio, total: round2(subtotal + itbms + envio) }
}

/* ─────────────── Portapapeles ─────────────── */

/** Copia con respaldo para navegadores viejos o servidos por http. */
export async function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    } catch {
      /* cae al método viejo */
    }
  }
  const ta = document.createElement('textarea')
  ta.value = texto
  ta.setAttribute('readonly', '')
  ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  ta.remove()
  return ok
}
