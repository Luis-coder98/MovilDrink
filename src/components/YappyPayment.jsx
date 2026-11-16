import { useStore } from '../store/StoreContext.jsx'
import { soloDigitos, telBonito, copiarAlPortapapeles } from '../lib/format.js'
import Modal from './Modal.jsx'

/**
 * Arma el resumen del pedido en texto plano, con formato de negritas de
 * Markdown. Lo usa el aviso al vendedor y el botón de copiar.
 */
export function resumenTexto(pedido, settings, money) {
  const L = []
  L.push(`*${settings.nombre || 'MovilDrink'}* — Pedido ${pedido.codigo}`)
  L.push('')
  pedido.items.forEach((l) => L.push(`• ${l.qty}× ${l.nombre} — ${money(l.subtotal)}`))
  L.push('')
  L.push(`Subtotal: ${money(pedido.subtotal)}`)
  if (pedido.itbms > 0) L.push(`ITBMS: ${money(pedido.itbms)}`)
  if (pedido.envio > 0) L.push(`Entrega: ${money(pedido.envio)}`)
  L.push(`*TOTAL: ${money(pedido.total)}*`)
  L.push('')
  L.push(`Pago: ${pedido.pago === 'yappy' ? 'Yappy' : 'Efectivo al recibir'}`)
  // Nombre y celular son opcionales: sólo se listan si el cliente los dio.
  if (pedido.cliente.nombre) L.push(`Cliente: ${pedido.cliente.nombre}`)
  if (pedido.cliente.telefono) L.push(`Celular: ${telBonito(pedido.cliente.telefono)}`)
  if (pedido.cliente.nota) L.push(`Nota: ${pedido.cliente.nota}`)
  return L.join('\n')
}

/** Fila con un dato y su botón de copiar. */
function FilaCopiar({ etiqueta, valor, aCopiar, onCopiado }) {
  return (
    <div className="copyrow">
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="copyrow__key">{etiqueta}</span>
        <div className="copyrow__val">{valor}</div>
      </div>
      <button
        className="btn btn--ghost btn--sm"
        type="button"
        onClick={async () => {
          const ok = await copiarAlPortapapeles(aCopiar ?? valor)
          onCopiado(ok, aCopiar ?? valor)
        }}
      >
        Copiar
      </button>
    </div>
  )
}

/** Paso 2 del pago: instrucciones de Yappy o de efectivo. */
export default function YappyPayment({ pedido, onCerrar, onListo }) {
  const { settings, money, toast } = useStore()
  const esYappy = pedido.pago === 'yappy'

  const alCopiar = (ok, texto) =>
    ok ? toast(`Copiado: ${texto}`) : toast(`Copia manualmente: ${texto}`, 'err')

  /**
   * Intenta abrir la app de Yappy con su esquema propio.
   * No existe un enlace profundo público para "pagar a un número", así
   * que esto es un atajo optimista: pase lo que pase, el número queda
   * copiado y visible para que el cliente lo pegue a mano.
   */
  async function abrirAppYappy() {
    const ok = await copiarAlPortapapeles(soloDigitos(settings.yappyNumero))
    if (ok) toast('Número Yappy copiado')
    window.location.href = 'yappy://'
    setTimeout(() => {
      if (!document.hidden) toast('Abre Yappy manualmente. Ya copiamos el número.', 'err')
    }, 1400)
  }

  return (
    <Modal titulo={esYappy ? 'Paga con Yappy' : 'Confirma tu pedido'} onCerrar={onCerrar}>
      {esYappy ? (
        <>
          <div className="paybox">
            <div className="paybox__label">Monto a enviar por Yappy</div>
            <div className="paybox__amount">{money(pedido.total)}</div>

            {settings.yappyQR && (
              <img className="paybox__qr" src={settings.yappyQR} alt="Código QR de Yappy del vendedor" />
            )}

            <FilaCopiar
              etiqueta={`Número Yappy${settings.yappyNombre ? ` · ${settings.yappyNombre}` : ''}`}
              valor={telBonito(settings.yappyNumero)}
              aCopiar={soloDigitos(settings.yappyNumero)}
              onCopiado={alCopiar}
            />
            {/* El monto se copia sin símbolo de moneda: es lo que se teclea
                dentro de Yappy, y el cliente ya está saltando de app. */}
            <FilaCopiar
              etiqueta="Monto exacto"
              valor={money(pedido.total)}
              aCopiar={pedido.total.toFixed(2)}
              onCopiado={alCopiar}
            />
            <FilaCopiar etiqueta="Concepto / descripción" valor={pedido.codigo} onCopiado={alCopiar} />
          </div>

          <ol className="steps">
            <li>
              Abre tu app de banco y entra a <b>Yappy</b>. Si tienes el <b>QR</b> a la vista,
              escanéalo y saltas al paso 3.
            </li>
            <li>
              Yappea al número <b>{telBonito(settings.yappyNumero)}</b>.
            </li>
            <li>
              Envía <b>{money(pedido.total)}</b> y escribe <b>{pedido.codigo}</b> en la
              descripción.
            </li>
            <li>Vuelve aquí y avísanos con el botón de abajo.</li>
          </ol>

          <button
            className="btn btn--yappy btn--block"
            type="button"
            onClick={abrirAppYappy}
            style={{ marginBottom: 10 }}
          >
            Abrir la app de Yappy
          </button>
        </>
      ) : (
        <div className="paybox">
          <div className="paybox__label">Pagas en efectivo al recibir</div>
          <div className="paybox__amount">{money(pedido.total)}</div>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '.88rem' }}>
            Ten el monto listo. Si necesitas cambio, dínoslo en el mensaje.
          </p>
        </div>
      )}

      <div className="note">
        Guarda tu código <b>{pedido.codigo}</b>. Puedes volver a ver este pedido en{' '}
        <b>Mis pedidos</b>.
      </div>

      <button className="btn btn--block" type="button" onClick={onListo}>
        Listo
      </button>
    </Modal>
  )
}
