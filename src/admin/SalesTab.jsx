import { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { round2 } from '../lib/format.js'
import { Stat } from './AdminPanel.jsx'

/** Clave YYYY-MM-DD en hora local, para agrupar por día de venta. */
function claveDia(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function etiquetaDia(clave) {
  const [a, m, d] = clave.split('-').map(Number)
  const fecha = new Date(a, m - 1, d)
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(hoy.getDate() - 1)

  if (claveDia(fecha) === claveDia(hoy)) return 'Hoy'
  if (claveDia(fecha) === claveDia(ayer)) return 'Ayer'

  return fecha.toLocaleDateString('es-PA', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
}

/**
 * Contabilidad diaria.
 *
 * Sólo cuenta pedidos no cancelados, y sólo los que existen EN ESTE
 * dispositivo: los que un cliente hizo desde su propio celular no llegan
 * aquí. Por eso arriba se avisa.
 */
export default function SalesTab() {
  const { pedidos, money } = useStore()
  const [expandido, setExpandido] = useState(null)

  const dias = useMemo(() => {
    const mapa = new Map()

    pedidos
      .filter((o) => o.estado !== 'cancelado')
      .forEach((o) => {
        const k = claveDia(o.fecha)
        if (!mapa.has(k)) {
          mapa.set(k, { clave: k, pedidos: 0, total: 0, yappy: 0, efectivo: 0, cobrado: 0, porCobrar: 0, items: new Map() })
        }
        const d = mapa.get(k)
        d.pedidos += 1
        d.total = round2(d.total + o.total)
        if (o.pago === 'yappy') d.yappy = round2(d.yappy + o.total)
        else d.efectivo = round2(d.efectivo + o.total)

        if (o.estado === 'pendiente') d.porCobrar = round2(d.porCobrar + o.total)
        else d.cobrado = round2(d.cobrado + o.total)

        o.items.forEach((l) => {
          const prev = d.items.get(l.nombre) || { qty: 0, total: 0 }
          d.items.set(l.nombre, {
            qty: prev.qty + l.qty,
            total: round2(prev.total + l.subtotal),
          })
        })
      })

    return [...mapa.values()].sort((a, b) => b.clave.localeCompare(a.clave))
  }, [pedidos])

  const resumen = useMemo(() => {
    const hoy = claveDia(new Date())
    const hace7 = new Date()
    hace7.setDate(hace7.getDate() - 6)
    const desde7 = claveDia(hace7)
    const mesActual = hoy.slice(0, 7)

    const deHoy = dias.find((d) => d.clave === hoy)
    const semana = dias.filter((d) => d.clave >= desde7)
    const mes = dias.filter((d) => d.clave.startsWith(mesActual))

    return {
      hoy: deHoy?.total ?? 0,
      pedidosHoy: deHoy?.pedidos ?? 0,
      semana: round2(semana.reduce((a, d) => a + d.total, 0)),
      mes: round2(mes.reduce((a, d) => a + d.total, 0)),
      porCobrar: round2(dias.reduce((a, d) => a + d.porCobrar, 0)),
    }
  }, [dias])

  /** Lo más vendido de todos los tiempos, para saber qué reponer. */
  const topProductos = useMemo(() => {
    const mapa = new Map()
    pedidos
      .filter((o) => o.estado !== 'cancelado')
      .forEach((o) =>
        o.items.forEach((l) => {
          const prev = mapa.get(l.nombre) || { qty: 0, total: 0 }
          mapa.set(l.nombre, { qty: prev.qty + l.qty, total: round2(prev.total + l.subtotal) })
        })
      )
    return [...mapa.entries()]
      .map(([nombre, v]) => ({ nombre, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
  }, [pedidos])

  const maxQty = topProductos[0]?.qty || 1

  return (
    <>
      <div className="stats">
        <Stat etiqueta={`Hoy (${resumen.pedidosHoy} pedidos)`} valor={money(resumen.hoy)} />
        <Stat etiqueta="Últimos 7 días" valor={money(resumen.semana)} />
        <Stat etiqueta="Este mes" valor={money(resumen.mes)} />
        <Stat etiqueta="Por cobrar" valor={money(resumen.porCobrar)} />
      </div>

      <div className="note">
        Aquí sólo se cuentan los pedidos guardados <b>en este dispositivo</b>. Los que un cliente
        haga desde su propio celular no aparecen — para eso sirve el aviso por Telegram.
      </div>

      <div className="section-title">Ventas por día</div>

      {!dias.length ? (
        <p className="empty">
          <span aria-hidden="true">📊</span>
          Todavía no hay ventas registradas.
        </p>
      ) : (
        <div className="dias">
          {dias.map((d) => (
            <div className="dia" key={d.clave}>
              <button
                className="dia__head"
                onClick={() => setExpandido(expandido === d.clave ? null : d.clave)}
                aria-expanded={expandido === d.clave}
              >
                <div className="dia__fecha">
                  <strong>{etiquetaDia(d.clave)}</strong>
                  <small>
                    {d.pedidos} {d.pedidos === 1 ? 'pedido' : 'pedidos'}
                  </small>
                </div>
                <div className="dia__cifras">
                  <span className="dia__total">{money(d.total)}</span>
                  <small>
                    {d.yappy > 0 && `Yappy ${money(d.yappy)}`}
                    {d.yappy > 0 && d.efectivo > 0 && ' · '}
                    {d.efectivo > 0 && `Efectivo ${money(d.efectivo)}`}
                  </small>
                </div>
                <span className="dia__flecha">{expandido === d.clave ? '▲' : '▼'}</span>
              </button>

              {expandido === d.clave && (
                <div className="dia__detalle">
                  {d.porCobrar > 0 && (
                    <div className="dia__aviso">Pendiente de cobro: {money(d.porCobrar)}</div>
                  )}
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...d.items.entries()]
                        .sort((a, b) => b[1].qty - a[1].qty)
                        .map(([nombre, v]) => (
                          <tr key={nombre}>
                            <td>{nombre}</td>
                            <td>{v.qty}</td>
                            <td>{money(v.total)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {topProductos.length > 0 && (
        <>
          <div className="section-title">Lo que más se vende</div>
          <div className="ranking">
            {topProductos.map((p) => (
              <div className="rank" key={p.nombre}>
                <div className="rank__nombre">{p.nombre}</div>
                <div className="rank__barra">
                  <div className="rank__relleno" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                </div>
                <div className="rank__cifra">
                  {p.qty} · {money(p.total)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
