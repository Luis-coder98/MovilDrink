import { useStore } from '../store/StoreContext.jsx'
import { ESTADOS } from '../data/seed.js'
import { fechaLarga } from '../lib/format.js'

/** Historial de pedidos visto por el cliente. */
export default function Orders({ navegar, onVerPago }) {
  const { pedidos, money, productos, vaciarCarrito, agregarAlCarrito, toast } = useStore()

  /** Vuelve a cargar en el carrito lo que se pueda del pedido. */
  function repetir(o) {
    vaciarCarrito()
    const faltantes = []
    let cargados = 0

    o.items.forEach((l) => {
      const p = productos.find((x) => x.id === l.id)
      if (!p || !p.activo || p.stock <= 0) {
        faltantes.push(l.nombre)
        return
      }
      const cant = Math.min(l.qty, p.stock)
      agregarAlCarrito(p.id, cant)
      cargados++
      if (cant < l.qty) faltantes.push(`${l.nombre} (sólo ${cant})`)
    })

    if (!cargados) {
      toast('Ninguno de esos productos está disponible', 'err')
      return
    }
    navegar('catalogo')
    toast(faltantes.length ? `Agregado. Sin stock: ${faltantes.join(', ')}` : 'Pedido cargado en el carrito')
  }

  return (
    <>
      <div className="viewhead">
        <h1>Mis pedidos</h1>
        <button className="btn btn--ghost btn--sm" onClick={() => navegar('catalogo')}>
          Volver al catálogo
        </button>
      </div>

      {!pedidos.length ? (
        <p className="empty">
          <span aria-hidden="true">🧾</span>
          Todavía no hay pedidos.
        </p>
      ) : (
        pedidos.map((o) => {
          const est = ESTADOS[o.estado] || ESTADOS.pendiente
          return (
            <article className="order" key={o.id}>
              <div className="order__head">
                <div>
                  <div className="order__code">{o.codigo}</div>
                  <div className="order__date">{fechaLarga(o.fecha)}</div>
                </div>
                <span className={`tag ${est.tag}`}>{est.label}</span>
              </div>

              <div className="order__lines">
                {o.items.map((l) => `${l.qty}× ${l.nombre}`).join(' · ')}
              </div>

              <div className="order__foot">
                <span className="order__total">{money(o.total)}</span>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {o.pago === 'yappy' && o.estado === 'pendiente' && (
                    <button className="btn btn--yappy btn--sm" onClick={() => onVerPago(o)}>
                      Ver datos de pago
                    </button>
                  )}
                  <button className="btn btn--ghost btn--sm" onClick={() => repetir(o)}>
                    Repetir pedido
                  </button>
                </div>
              </div>
            </article>
          )
        })
      )}
    </>
  )
}
