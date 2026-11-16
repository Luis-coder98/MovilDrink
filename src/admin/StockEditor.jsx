import { useState, useMemo } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import Modal from '../components/Modal.jsx'

/**
 * Reposición rápida: todas las cantidades en una sola pantalla.
 * Pensado para usarlo cada mañana antes de salir a rodar.
 */
export default function StockEditor({ onCerrar }) {
  const { productos, fijarStockMasivo, toast } = useStore()

  const ordenados = useMemo(
    () => [...productos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    [productos]
  )

  const [valores, setValores] = useState(() =>
    Object.fromEntries(ordenados.map((p) => [p.id, String(p.stock)]))
  )

  function guardar(e) {
    e.preventDefault()
    fijarStockMasivo(valores)
    toast('Stock actualizado')
    onCerrar()
  }

  return (
    <Modal titulo="Reponer stock" onCerrar={onCerrar}>
      <p style={{ color: 'var(--text-dim)', fontSize: '.88rem' }}>
        Escribe cuántas unidades tienes ahora de cada producto.
      </p>

      <div className="adminbar" style={{ marginBottom: 8 }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setValores(Object.fromEntries(ordenados.map((p) => [p.id, '0'])))}
        >
          Poner todo en 0
        </button>
      </div>

      <form onSubmit={guardar}>
        {ordenados.map((p) => (
          <div className="stockrow" key={p.id}>
            <label htmlFor={`st_${p.id}`}>
              {p.emoji} {p.nombre}
            </label>
            <input
              id={`st_${p.id}`}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={valores[p.id] ?? ''}
              onChange={(e) => setValores((v) => ({ ...v, [p.id]: e.target.value }))}
            />
          </div>
        ))}

        <button className="btn btn--block" type="submit" style={{ marginTop: 16 }}>
          Guardar stock
        </button>
      </form>
    </Modal>
  )
}
