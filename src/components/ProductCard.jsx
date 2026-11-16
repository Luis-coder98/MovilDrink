import { useStore } from '../store/StoreContext.jsx'

/** Miniatura del producto: foto si tiene, si no el emoji. */
export function Media({ producto, className }) {
  if (producto.img) {
    return (
      <div className={className}>
        <img src={producto.img} alt="" loading="lazy" decoding="async" />
      </div>
    )
  }
  return (
    <div className={className} aria-hidden="true">
      {producto.emoji || '🥤'}
    </div>
  )
}

/** Botones − cantidad + */
export function Stepper({ cantidad, onMenos, onMas, topeAlcanzado, pequeño, nombre = '' }) {
  return (
    <div className={`stepper${pequeño ? ' stepper--sm' : ''}`}>
      <button type="button" onClick={onMenos} aria-label={`Quitar uno de ${nombre}`}>
        −
      </button>
      <span aria-live="polite">{cantidad}</span>
      <button
        type="button"
        onClick={onMas}
        disabled={topeAlcanzado}
        aria-label={`Agregar uno de ${nombre}`}
      >
        +
      </button>
    </div>
  )
}

export default function ProductCard({ producto: p }) {
  const { money, cantidadEnCarrito, agregarAlCarrito } = useStore()

  const enCarrito = cantidadEnCarrito(p.id)
  const agotado = p.stock <= 0
  const pocas = !agotado && p.stock <= 5

  return (
    <article className={`card${agotado ? ' is-out' : ''}`}>
      <Media producto={p} className="card__media" />

      {agotado && <span className="card__badge">Agotado</span>}
      {pocas && <span className="card__badge card__badge--low">Quedan {p.stock}</span>}

      <div className="card__body">
        <h3 className="card__name">{p.nombre}</h3>
        {p.desc && <p className="card__desc">{p.desc}</p>}

        <div className="card__foot">
          <span className="card__price">{money(p.precio)}</span>

          {agotado ? (
            <button className="addbtn" type="button" disabled aria-label="Agotado">
              ×
            </button>
          ) : enCarrito > 0 ? (
            <Stepper
              cantidad={enCarrito}
              nombre={p.nombre}
              onMenos={() => agregarAlCarrito(p.id, -1)}
              onMas={() => agregarAlCarrito(p.id, 1)}
              topeAlcanzado={enCarrito >= p.stock}
            />
          ) : (
            <button
              className="addbtn"
              type="button"
              onClick={() => agregarAlCarrito(p.id, 1)}
              aria-label={`Agregar ${p.nombre} al carrito`}
            >
              +
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
