import { useState, useMemo } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { CATEGORIAS } from '../data/seed.js'
import { Stat } from './AdminPanel.jsx'
import ProductEditor from './ProductEditor.jsx'
import StockEditor from './StockEditor.jsx'
import { Media } from '../components/ProductCard.jsx'

/** Listado de inventario con acceso a editar precios, fotos y stock. */
export default function ProductsTab() {
  const { productos, money, moverProducto } = useStore()

  const [editando, setEditando] = useState(null)   // producto | 'nuevo' | null
  const [reponiendo, setReponiendo] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [catFiltro, setCatFiltro] = useState('todas')

  const ordenados = useMemo(
    () => [...productos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    [productos]
  )

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    return ordenados.filter((p) => {
      if (catFiltro !== 'todas' && p.cat !== catFiltro) return false
      if (!q) return true
      return p.nombre.toLowerCase().includes(q)
    })
  }, [ordenados, filtro, catFiltro])

  const stats = useMemo(() => {
    const activos = productos.filter((p) => p.activo)
    return {
      activos: activos.length,
      agotados: activos.filter((p) => p.stock <= 0).length,
      bajos: activos.filter((p) => p.stock > 0 && p.stock <= 5).length,
      valor: productos.reduce((a, p) => a + p.precio * p.stock, 0),
    }
  }, [productos])

  return (
    <>
      <div className="stats">
        <Stat etiqueta="Productos activos" valor={stats.activos} />
        <Stat etiqueta="Agotados" valor={stats.agotados} />
        <Stat etiqueta="Stock bajo (≤5)" valor={stats.bajos} />
        <Stat etiqueta="Valor del inventario" valor={money(stats.valor)} />
      </div>

      <div className="adminbar">
        <button className="btn btn--sm" onClick={() => setEditando('nuevo')}>
          + Nuevo producto
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => setReponiendo(true)}>
          Reponer stock
        </button>
      </div>

      <div className="adminfiltros">
        <div className="search search--sm">
          <input
            type="search"
            placeholder="Buscar en el inventario…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            aria-label="Buscar en el inventario"
          />
        </div>
        <select
          value={catFiltro}
          onChange={(e) => setCatFiltro(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {!visibles.length && (
        <p className="empty">
          <span aria-hidden="true">📦</span>
          Nada coincide con ese filtro.
        </p>
      )}

      <div className="plist">
        {visibles.map((p, i) => {
          const cat = CATEGORIAS.find((c) => c.id === p.cat)
          return (
            <div className={`prow${p.activo ? '' : ' is-off'}`} key={p.id}>
              <Media producto={p} className="prow__media" />

              <div className="prow__info">
                <div className="prow__name">
                  {p.nombre}
                  {!p.activo && ' · oculto'}
                </div>
                <div className="prow__meta">
                  {money(p.precio)} · {cat ? `${cat.emoji} ${cat.nombre}` : p.cat} ·{' '}
                  {p.stock <= 0 ? (
                    <b style={{ color: 'var(--danger)' }}>agotado</b>
                  ) : (
                    `${p.stock} en stock`
                  )}
                </div>
              </div>

              <div className="prow__acts">
                {/* Reordenar sólo tiene sentido sin filtros activos */}
                {filtro === '' && catFiltro === 'todas' && (
                  <div className="reorder">
                    <button
                      type="button"
                      onClick={() => moverProducto(p.id, -1)}
                      disabled={i === 0}
                      aria-label={`Subir ${p.nombre}`}
                      title="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moverProducto(p.id, 1)}
                      disabled={i === visibles.length - 1}
                      aria-label={`Bajar ${p.nombre}`}
                      title="Bajar"
                    >
                      ↓
                    </button>
                  </div>
                )}
                <button className="btn btn--ghost btn--sm" onClick={() => setEditando(p)}>
                  Editar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editando && (
        <ProductEditor
          producto={editando === 'nuevo' ? null : editando}
          onCerrar={() => setEditando(null)}
        />
      )}

      {reponiendo && <StockEditor onCerrar={() => setReponiendo(false)} />}
    </>
  )
}
