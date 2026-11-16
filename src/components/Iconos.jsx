/* Íconos SVG en línea. Sin librería externa: son pocos y así no
   agregamos dependencias ni peticiones de red. */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function IconoX({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function IconoBuscar({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

export function IconoCarrito({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M3 4h2.2l2.3 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.55L21 8H6.2" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </svg>
  )
}

export function IconoRecibo({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M6 3h12l1.5 4.5H4.5L6 3Z" />
      <path d="M4.5 7.5h15V19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7.5Z" />
      <path d="M9.5 11.5h5" />
    </svg>
  )
}

export function IconoSol({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
    </svg>
  )
}

export function IconoLuna({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

/** Logo de la app: un vaso con pajilla. */
export function LogoVaso({ size = 26 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M6 9h20l-2.2 15.2A3 3 0 0 1 20.8 27h-9.6a3 3 0 0 1-3-2.8L6 9Z"
        fill="currentColor"
        opacity=".92"
      />
      <path d="M4 6.5h24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M13 13.5v8M19 13.5v8"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".65"
      />
    </svg>
  )
}
