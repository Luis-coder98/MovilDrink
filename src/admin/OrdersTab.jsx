import { useState, useMemo } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { ESTADOS } from '../data/seed.js'
import { fechaLarga, telBonito, telInternacional } from '../lib/format.js'
import { Stat } from './AdminPanel.jsx'
import { ModalConfirmar } from '../components/Modal.jsx'

/** Pedidos recibidos, con cambio de estado y contacto al cliente. */
export default function OrdersTab() {
  const { pedidos, settings, money, cambiarEstadoPedido, borrarPedido, reenviarAviso, toast } =
    useStore()
  const [filtro, setFiltro] = useState('todos')
  const [aBorrar, setABorrar] = useState(null)
  const [reenviando, setReenviando] = useState(null)

  async function reintentar(id) {
    setReenviando(id)
    const { ok, error } = await reenviarAviso(id)
    setReenviando(null)
    toast(ok ? 'Aviso enviado' : `No se pudo: ${error}`, ok ? 'ok' : 'err')
  }

  const stats = useMemo(() => {
    const hoy = new Date().toDateString()
    const deHoy = pedidos.filter(
      (o) => new Date(o.fecha).toDateString() === hoy && o.estado !== 'cancelado'
    )
    return {
      hoy: deHoy.length,
      ventasHoy: deHoy.reduce((a, o) => a + o.total, 0),
      porCobrar: pedidos
        .filter((o) => o.estado === 'pendiente')
        .reduce((a, o) => a + o.total, 0),
      total: pedidos.length,
    }
  }, [pedidos])

  const visibles = useMemo(
    () => (filtro === 'todos' ? pedidos : pedidos.filter((o) => o.estado === filtro)),
    [pedidos, filtro]
  )

  function escribirAlCliente(o) {
    const num = telInternacional(o.cliente.telefono)
    const saludo = o.cliente.nombre ? `Hola ${o.cliente.nombre}` : 'Hola'
    const msg = `${saludo}, soy ${settings.nombre}. Sobre tu pedido ${o.codigo} por ${money(o.total)}: `
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
  }

  return (
    <>
      <div className="stats">
        <Stat etiqueta="Pedidos hoy" valor={stats.hoy} />
        <Stat etiqueta="Ventas hoy" valor={money(stats.ventasHoy)} />
        <Stat etiqueta="Por cobrar" valor={money(stats.porCobrar)} />
        <Stat etiqueta="Pedidos totales" valor={stats.total} />
      </div>

      <div className="adminfiltros">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar pedidos">
          <option value="todos">Todos los pedidos</option>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {!visibles.length ? (
        <p className="empty">
          <span aria-hidden="true">🧾</span>
          {pedidos.length ? 'Ningún pedido con ese estado.' : 'Aún no hay pedidos.'}
        </p>
      ) : (
        visibles.map((o) => {
          const est = ESTADOS[o.estado] || ESTADOS.pendiente
          return (
            <article className="order" key={o.id}>
              <div className="order__head">
                <div>
                  <div className="order__code">
                    {o.codigo} · {o.pago === 'yappy' ? 'Yappy' : 'Efectivo'}
                  </div>
                  <div className="order__date">{fechaLarga(o.fecha)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Sólo se marca si el aviso llegó a fallar de verdad. */}
                  {o.avisado === false && (
                    <span className="tag tag--canc" title="El aviso por Telegram no llegó">
                      Sin avisar
                    </span>
                  )}
                  <span className={`tag ${est.tag}`}>{est.label}</span>
                </div>
              </div>

              <div className="order__lines">
                {/* Nombre y celular son opcionales desde el formulario. */}
                {(o.cliente.nombre || o.cliente.telefono) && (
                  <>
                    {o.cliente.nombre && <b>{o.cliente.nombre}</b>}
                    {o.cliente.nombre && o.cliente.telefono && ' · '}
                    {o.cliente.telefono && telBonito(o.cliente.telefono)}
                    <br />
                  </>
                )}
                {o.cliente.nota && (
                  <>
                    <i>Nota: {o.cliente.nota}</i>
                    <br />
                  </>
                )}
                {o.items.map((l) => `${l.qty}× ${l.nombre}`).join(' · ')}
              </div>

              <div className="order__foot">
                <span className="order__total">{money(o.total)}</span>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    className="estadosel"
                    value={o.estado}
                    onChange={(e) => cambiarEstadoPedido(o.id, e.target.value)}
                    aria-label={`Estado del pedido ${o.codigo}`}
                  >
                    {Object.entries(ESTADOS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  {o.avisado === false && (
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => reintentar(o.id)}
                      disabled={reenviando === o.id}
                    >
                      {reenviando === o.id ? 'Enviando…' : 'Reenviar aviso'}
                    </button>
                  )}
                  {/* Sólo tiene sentido si el cliente dejó su celular. */}
                  {o.cliente.telefono && (
                    <button className="btn btn--wa btn--sm" onClick={() => escribirAlCliente(o)}>
                      WhatsApp
                    </button>
                  )}
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => setABorrar(o)}
                    aria-label={`Borrar pedido ${o.codigo}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </article>
          )
        })
      )}

      {aBorrar && (
        <ModalConfirmar
          titulo="Borrar pedido"
          texto={`Se elimina ${aBorrar.codigo} del historial. Esto no devuelve el stock — para eso cámbialo a "Cancelado".`}
          textoBoton="Borrar"
          onCerrar={() => setABorrar(null)}
          onSi={() => borrarPedido(aBorrar.id)}
        />
      )}
    </>
  )
}
