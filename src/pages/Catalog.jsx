import ProductCard from '../components/ProductCard.jsx'

/** Rejilla de productos ya filtrados por el componente padre. */
export default function Catalog({ productos }) {
  if (!productos.length) {
    return (
      <p className="empty">
        <span aria-hidden="true">🔎</span>
        No encontramos productos con ese filtro.
      </p>
    )
  }

  return (
    <div className="grid">
      {productos.map((p) => (
        <ProductCard key={p.id} producto={p} />
      ))}
    </div>
  )
}
