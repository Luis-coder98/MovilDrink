import { useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import Modal from './Modal.jsx'
import { Totales } from './Cart.jsx'

/**
 * Paso 1 del pago.
 *
 * Está pensado para una venta en el auto: el cliente está a un metro de
 * distancia, así que no hace falta dirección ni forma de entrega. Nombre y
 * celular son opcionales — sólo sirven para que sepas de quién es el pedido.
 * Lo único obligatorio es cómo va a pagar.
 */
export default function CheckoutForm({ onCerrar, onConfirmado }) {
  const { settings, cliente, totales, crearPedido, money } = useStore()

  const [form, setForm] = useState({
    nombre: cliente.nombre || '',
    telefono: cliente.telefono || '',
    nota: '',
    pago: '',            // vacío a propósito: elegirlo es obligatorio
  })
  const [errores, setErrores] = useState({})

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const hayMetodoPago = Boolean(settings.yappyNumero) || settings.aceptaEfectivo

  function enviar(e) {
    e.preventDefault()

    if (!form.pago) {
      setErrores({ pago: 'Elige cómo vas a pagar.' })
      return
    }
    setErrores({})

    const pedido = crearPedido({
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      nota: form.nota.trim(),
      pago: form.pago,
    })
    onConfirmado(pedido)
  }

  return (
    <Modal titulo="Datos del pedido" onCerrar={onCerrar}>
      <form onSubmit={enviar} noValidate>
        <div className="row2">
          <label className="field">
            <span>Tu nombre</span>
            <input
              type="text"
              autoComplete="name"
              maxLength={60}
              placeholder="Opcional"
              value={form.nombre}
              onChange={set('nombre')}
            />
          </label>

          <label className="field">
            <span>Celular</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              placeholder="Opcional"
              value={form.telefono}
              onChange={set('telefono')}
            />
          </label>
        </div>

        <label className="field">
          <span>Nota para el vendedor</span>
          <input
            type="text"
            maxLength={140}
            placeholder="Opcional. Ej. bien frías, sin hielo"
            value={form.nota}
            onChange={set('nota')}
          />
        </label>

        <div className="section-title">¿Cómo vas a pagar? *</div>

        {hayMetodoPago ? (
          <div className={`payopts${errores.pago ? ' payopts--error' : ''}`}>
            {settings.yappyNumero && (
              <label className="payopt">
                <input
                  type="radio"
                  name="pago"
                  value="yappy"
                  checked={form.pago === 'yappy'}
                  onChange={set('pago')}
                />
                <span className="payopt__ico payopt__ico--yappy">Y</span>
                <span>
                  <b>Yappy</b>
                  <small>Transferencia inmediata desde tu banco</small>
                </span>
              </label>
            )}

            {settings.aceptaEfectivo && (
              <label className="payopt">
                <input
                  type="radio"
                  name="pago"
                  value="efectivo"
                  checked={form.pago === 'efectivo'}
                  onChange={set('pago')}
                />
                <span className="payopt__ico">💵</span>
                <span>
                  <b>Efectivo</b>
                  <small>Pagas al recibir el pedido</small>
                </span>
              </label>
            )}
          </div>
        ) : (
          <div className="note">
            El vendedor aún no configuró un método de pago. Entra al <b>Panel del vendedor</b> y
            agrega tu número de Yappy.
          </div>
        )}

        {errores.pago && (
          <span className="err" style={{ display: 'block', marginBottom: 12 }}>
            {errores.pago}
          </span>
        )}

        <Totales t={totales} />

        <button className="btn btn--block" type="submit" disabled={!hayMetodoPago}>
          Confirmar pedido · {money(totales.total)}
        </button>
      </form>
    </Modal>
  )
}
