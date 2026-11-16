/* Hooks propios, chiquitos y reutilizables. */

import { useState, useEffect, useCallback } from 'react'

/* ─────────────── Tema claro / oscuro ─────────────── */

const TEMA_KEY = 'movildrink.tema'

export function useTheme() {
  const [tema, setTema] = useState(() => {
    try {
      const guardado = localStorage.getItem(TEMA_KEY)
      if (guardado) return guardado
    } catch { /* localStorage bloqueado */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tema === 'dark' ? '#0b1220' : '#0d9488')
    try {
      localStorage.setItem(TEMA_KEY, tema)
    } catch { /* sin persistencia, pero la app sigue */ }
  }, [tema])

  const alternar = useCallback(() => setTema((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return [tema, alternar]
}

/* ─────────────── Ruta por hash ─────────────── */

/**
 * Router mínimo: #/catalogo, #/pedidos, #/admin.
 * Con hash en vez de History API para que funcione igual en Netlify,
 * en GitHub Pages y abierto desde disco, sin configurar redirecciones.
 */
const VISTAS = ['catalogo', 'pedidos', 'admin']

function leerHash() {
  const v = (window.location.hash || '').replace(/^#\/?/, '')
  return VISTAS.includes(v) ? v : 'catalogo'
}

export function useHashRoute() {
  const [vista, setVista] = useState(leerHash)

  useEffect(() => {
    const alCambiar = () => setVista(leerHash())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  const navegar = useCallback((v) => {
    const destino = VISTAS.includes(v) ? v : 'catalogo'
    if (leerHash() !== destino) window.location.hash = `#/${destino}`
    else setVista(destino)
    window.scrollTo({ top: 0 })
  }, [])

  return [vista, navegar]
}

/* ─────────────── Media query ─────────────── */

export function useMediaQuery(consulta) {
  const [activa, setActiva] = useState(() => window.matchMedia?.(consulta).matches ?? false)

  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const alCambiar = (e) => setActiva(e.matches)
    mq.addEventListener('change', alCambiar)
    setActiva(mq.matches)
    return () => mq.removeEventListener('change', alCambiar)
  }, [consulta])

  return activa
}

/** true en laptop/desktop, donde el carrito va fijo al costado. */
export function useEsPantallaAncha() {
  return useMediaQuery('(min-width: 1080px)')
}

/* ─────────────── Bloquear el scroll del fondo ─────────────── */

export function useBloquearScroll(activo) {
  useEffect(() => {
    if (!activo) return
    document.body.classList.add('is-locked')
    return () => document.body.classList.remove('is-locked')
  }, [activo])
}

/* ─────────────── Descargar un archivo ─────────────── */

export function descargarArchivo(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: `${tipo};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
