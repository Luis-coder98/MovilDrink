import { useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import ProductsTab from './ProductsTab.jsx'
import OrdersTab from './OrdersTab.jsx'
import SalesTab from './SalesTab.jsx'
import SettingsTab from './SettingsTab.jsx'
import PosterTab from './PosterTab.jsx'
import BackupTab from './BackupTab.jsx'

/**
 * Puerta de entrada al panel.
 *
 * Aviso: el PIN sólo evita que un cliente curioso toque los precios desde
 * tu mismo teléfono. No es seguridad real — todo corre en el navegador y
 * cualquiera con conocimientos puede saltárselo. No guardes aquí nada
 * sensible.
 */
function PinGate({ onEntrar }) {
  const { settings } = useStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function enviar(e) {
    e.preventDefault()
    if (pin === String(settings.pin)) onEntrar()
    else {
      setError('PIN incorrecto.')
      setPin('')
    }
  }

  return (
    <div style={{ maxWidth: 340, margin: '40px auto' }}>
      <p className="empty" style={{ padding: '0 0 18px' }}>
        <span aria-hidden="true">🔒</span>
        Panel del vendedor
      </p>
      <form onSubmit={enviar}>
        <label className={`field${error ? ' field--error' : ''}`}>
          <span>PIN de acceso</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError('')
            }}
          />
          {error ? (
            <span className="err">{error}</span>
          ) : (
            <small>
              PIN inicial: <b>1234</b>. Cámbialo en Ajustes.
            </small>
          )}
        </label>
        <button className="btn btn--block" type="submit">
          Entrar
        </button>
      </form>
    </div>
  )
}

const PESTAÑAS = [
  { id: 'productos', label: 'Productos' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'ajustes', label: 'Ajustes' },
  { id: 'cartel', label: 'Cartel QR' },
  { id: 'respaldo', label: 'Respaldo' },
]

export default function AdminPanel({ navegar }) {
  const { toast } = useStore()
  const [desbloqueado, setDesbloqueado] = useState(false)
  const [tab, setTab] = useState('productos')

  if (!desbloqueado) return <PinGate onEntrar={() => setDesbloqueado(true)} />

  return (
    <>
      <div className="viewhead">
        <h1>Panel del vendedor</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setDesbloqueado(false)
              navegar('catalogo')
              toast('Panel bloqueado')
            }}
          >
            Bloquear
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => navegar('catalogo')}>
            Ver tienda
          </button>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {PESTAÑAS.map((p) => (
          <button
            key={p.id}
            className="tab"
            role="tab"
            aria-selected={tab === p.id}
            onClick={() => setTab(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {tab === 'productos' && <ProductsTab />}
      {tab === 'pedidos' && <OrdersTab />}
      {tab === 'ventas' && <SalesTab />}
      {tab === 'ajustes' && <SettingsTab />}
      {tab === 'cartel' && <PosterTab />}
      {tab === 'respaldo' && <BackupTab />}
    </>
  )
}

/** Tarjeta de estadística, compartida por varias pestañas. */
export function Stat({ etiqueta, valor }) {
  return (
    <div className="stat">
      <div className="stat__k">{etiqueta}</div>
      <div className="stat__v">{valor}</div>
    </div>
  )
}
