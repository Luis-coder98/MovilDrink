import { useStore } from '../store/StoreContext.jsx'
import {
  LogoVaso, IconoSol, IconoLuna, IconoRecibo, IconoCarrito, IconoBuscar, IconoX,
} from './Iconos.jsx'

/**
 * Encabezado fijo: marca, acciones, buscador y chips de categoría.
 * El buscador y los chips sólo aparecen en el catálogo.
 */
export default function Header({
  tema, alternarTema, vista, navegar, onAbrirCarrito,
  busqueda, setBusqueda, categoria, setCategoria, categorias,
}) {
  const { settings, totales } = useStore()
  const esCatalogo = vista === 'catalogo'

  return (
    <header className="topbar">
      <div className="topbar__row">
        <button className="brand" type="button" onClick={() => navegar('catalogo')} aria-label="Ir al inicio">
          <span className="brand__mark">
            <LogoVaso />
          </span>
          <span className="brand__text">
            <strong>{settings.nombre || 'MovilDrink'}</strong>
            <small>{settings.abierto ? settings.eslogan : '● Cerrado ahora'}</small>
          </span>
        </button>

        <div className="topbar__actions">
          <button
            className="iconbtn"
            type="button"
            onClick={alternarTema}
            aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title="Cambiar tema"
          >
            {tema === 'dark' ? <IconoLuna /> : <IconoSol />}
          </button>

          <button
            className="iconbtn"
            type="button"
            onClick={() => navegar('pedidos')}
            aria-label="Mis pedidos"
            title="Mis pedidos"
          >
            <IconoRecibo />
          </button>

          <button className="cartbtn" type="button" onClick={onAbrirCarrito} aria-label="Ver carrito">
            <IconoCarrito />
            {totales.unidades > 0 && <span className="cartbtn__count">{totales.unidades}</span>}
          </button>
        </div>
      </div>

      {esCatalogo && (
        <>
          <div className="topbar__row topbar__row--search">
            <div className="search">
              <IconoBuscar />
              <input
                type="search"
                inputMode="search"
                placeholder="Buscar bebida o confitura…"
                autoComplete="off"
                aria-label="Buscar productos"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button
                  className="search__clear"
                  type="button"
                  onClick={() => setBusqueda('')}
                  aria-label="Limpiar búsqueda"
                >
                  <IconoX size={14} />
                </button>
              )}
            </div>
          </div>

          <nav className="chips" aria-label="Categorías">
            {categorias.map((c) => (
              <button
                key={c.id}
                className="chip"
                type="button"
                aria-pressed={categoria === c.id}
                onClick={() => setCategoria(c.id)}
              >
                {c.emoji ? `${c.emoji} ` : ''}
                {c.nombre} ({c.conteo})
              </button>
            ))}
          </nav>
        </>
      )}
    </header>
  )
}
