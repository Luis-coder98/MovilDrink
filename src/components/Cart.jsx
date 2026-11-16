import { useStore } from '../store/StoreContext.jsx'
import { Media, Stepper } from './ProductCard.jsx'
import { IconoX } from './Iconos.jsx'

/** Desglose de subtotal, ITBMS, entrega y total. */
export function Totales({ t }) {
  const { settings, money } = useStore()
  return (
    <div className="totals">
      <div className="totals__row">
        <span>Subtotal ({t.unidades} art.)</span>
        <span>{money(t.subtotal)}</span>
      </div>
      {t.itbms > 0 && (
        <div className="totals__row">
          <span>ITBMS {settings.itbmsTasa}%</span>
          <span>{money(t.itbms)}</span>
        </div>
      )}
      <div className="totals__row">
        <span>Entrega</span>
        <span>{t.envio > 0 ? money(t.envio) : 'Gratis'}</span>
      </div>
      <div className="totals__row totals__row--grand">
        <span>Total</span>
        <span>{money(t.total)}</span>
      </div>
    </div>
  )
}

/**
 * Carrito. En celular y tablet es una hoja que sube desde abajo;
 * en laptop queda fijo al costado y `abierto` se ignora.
 */
export default function Cart({ abierto, onCerrar, onPagar, onVaciar, esAncha }) {
  const { settings, lineasCarrito, totales, agregarAlCarrito, money } = useStore()

  const minimo = Number(settings.minimoPedido) || 0
  const faltaMinimo = minimo > 0 && totales.subtotal < minimo
  const cerrado = !settings.abierto
  const vacio = lineasCarrito.length === 0

  return (
    <aside
      className={`cart${abierto ? ' is-open' : ''}`}
      aria-label="Carrito de compras"
      aria-hidden={!esAncha && !abierto}
    >
      <div className="cart__head">
        <h2>Tu pedido</h2>
        {!esAncha && (
          <button className="iconbtn cart__close" type="button" onClick={onCerrar} aria-label="Cerrar carrito">
            <IconoX />
          </button>
        )}
      </div>

      <div className="cart__body">
        {vacio ? (
          <p className="empty">
            <span aria-hidden="true">🛒</span>
            Tu pedido está vacío.
            <br />
            Agrega bebidas o confituras del catálogo.
          </p>
        ) : (
          lineasCarrito.map((l) => (
            <div className="citem" key={l.id}>
              <Media producto={l} className="citem__media" />
              <div className="citem__info">
                <div className="citem__name">{l.nombre}</div>
                <div className="citem__meta">{money(l.precio)} c/u</div>
              </div>
              <div className="citem__right">
                <span className="citem__sum">{money(l.precio * l.qty)}</span>
                <Stepper
                  pequeño
                  cantidad={l.qty}
                  nombre={l.nombre}
                  onMenos={() => agregarAlCarrito(l.id, -1)}
                  onMas={() => agregarAlCarrito(l.id, 1)}
                  topeAlcanzado={l.qty >= l.stock}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {!vacio && (
        <div className="cart__foot">
          <Totales t={totales} />

          {cerrado && <div className="note">{settings.mensajeCerrado || 'Cerrado por ahora.'}</div>}
          {!cerrado && faltaMinimo && (
            <div className="note">
              El pedido mínimo es {money(minimo)}. Te faltan {money(minimo - totales.subtotal)}.
            </div>
          )}

          <button className="btn btn--block" onClick={onPagar} disabled={faltaMinimo || cerrado}>
            Continuar al pago
          </button>
          <button className="linkbtn" style={{ display: 'block', margin: '11px auto 0' }} onClick={onVaciar}>
            Vaciar pedido
          </button>
        </div>
      )}
    </aside>
  )
}

/** Barra flotante con el total, sólo en celular y tablet. */
export function CartBar({ onAbrir }) {
  const { totales, money } = useStore()
  if (totales.unidades === 0) return null

  return (
    <button className="cartbar" type="button" onClick={onAbrir}>
      <span className="cartbar__qty">{totales.unidades}</span>
      <span className="cartbar__label">Ver pedido</span>
      <span className="cartbar__total">{money(totales.total)}</span>
    </button>
  )
}
