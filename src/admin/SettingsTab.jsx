import { useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { comprimirImagen, pesoDataUrl } from '../lib/image.js'
import { enviarTelegram, mensajePrueba, telegramListo } from '../lib/telegram.js'

/** Configuración del negocio: identidad, Yappy, contacto y precios. */
export default function SettingsTab() {
  const { settings, guardarSettings, toast } = useStore()
  const [form, setForm] = useState(settings)
  const [subiendoQR, setSubiendoQR] = useState(false)
  const [probando, setProbando] = useState(false)

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  async function alElegirQR(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoQR(true)
    try {
      // El QR va más grande y con más calidad que las fotos de producto:
      // tiene que poder escanearse desde la pantalla del cliente.
      const dataUrl = await comprimirImagen(file, 640, 0.92)
      set('yappyQR', dataUrl)
      toast(`QR cargado (${pesoDataUrl(dataUrl)} KB)`)
    } catch (err) {
      toast(err.message, 'err')
    } finally {
      setSubiendoQR(false)
      e.target.value = ''
    }
  }

  /** Manda un mensaje de prueba con los valores del formulario, sin guardar. */
  async function probarTelegram() {
    if (!telegramListo(form)) {
      toast('Completa el token y el Chat ID', 'err')
      return
    }
    setProbando(true)
    const { ok, error } = await enviarTelegram(form, mensajePrueba(form))
    setProbando(false)
    toast(ok ? 'Mensaje enviado. Revisa tu Telegram.' : `No se pudo: ${error}`, ok ? 'ok' : 'err')
  }

  function guardar(e) {
    e.preventDefault()
    guardarSettings({
      ...form,
      nombre: form.nombre.trim() || 'MovilDrink',
      moneda: form.moneda.trim() || 'B/.',
      pin: String(form.pin).trim() || '1234',
      delivery: Math.max(0, parseFloat(form.delivery) || 0),
      minimoPedido: Math.max(0, parseFloat(form.minimoPedido) || 0),
      itbmsTasa: Math.max(0, parseFloat(form.itbmsTasa) || 0),
    })
    toast('Ajustes guardados')
  }

  return (
    <form onSubmit={guardar}>
      <div className="section-title">Tu negocio</div>

      <label className="field">
        <span>Nombre</span>
        <input maxLength={40} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
      </label>

      <label className="field">
        <span>Eslogan</span>
        <input maxLength={60} value={form.eslogan} onChange={(e) => set('eslogan', e.target.value)} />
      </label>

      <label className="switch">
        <input
          type="checkbox"
          checked={form.abierto}
          onChange={(e) => set('abierto', e.target.checked)}
        />
        <span>
          Abierto ahora
          <small>Apágalo y nadie podrá confirmar pedidos</small>
        </span>
      </label>

      <label className="field">
        <span>Mensaje cuando está cerrado</span>
        <input
          maxLength={90}
          value={form.mensajeCerrado}
          onChange={(e) => set('mensajeCerrado', e.target.value)}
        />
      </label>

      <div className="section-title">Cobros con Yappy</div>

      <div className="row2">
        <label className="field">
          <span>Número Yappy</span>
          <input
            type="tel"
            inputMode="tel"
            placeholder="6123-4567"
            value={form.yappyNumero}
            onChange={(e) => set('yappyNumero', e.target.value)}
          />
          <small>El celular asociado a tu Yappy.</small>
        </label>

        <label className="field">
          <span>Nombre en Yappy</span>
          <input
            maxLength={40}
            placeholder="Juan P."
            value={form.yappyNombre}
            onChange={(e) => set('yappyNombre', e.target.value)}
          />
          <small>Para que el cliente confirme a quién le envía.</small>
        </label>
      </div>

      <div className="field">
        <span>Tu código QR de Yappy (opcional)</span>
        <input type="file" accept="image/*" onChange={alElegirQR} disabled={subiendoQR} />
        <small>
          Sácale captura al QR desde tu app de Yappy y súbelo aquí. El cliente lo escanea y no tiene
          que teclear el número.
        </small>

        {subiendoQR && <small>Procesando…</small>}

        {form.yappyQR && !subiendoQR && (
          <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={form.yappyQR}
              alt="Vista previa del QR de Yappy"
              style={{
                width: 110, height: 110, objectFit: 'contain',
                borderRadius: 12, background: '#fff', padding: 6,
              }}
            />
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => set('yappyQR', '')}>
              Quitar
            </button>
          </div>
        )}
      </div>

      <label className="switch">
        <input
          type="checkbox"
          checked={form.aceptaEfectivo}
          onChange={(e) => set('aceptaEfectivo', e.target.checked)}
        />
        <span>
          Aceptar también efectivo
          <small>Se cobra al entregar</small>
        </span>
      </label>

      <div className="section-title">Contacto</div>

      <label className="field">
        <span>WhatsApp del negocio</span>
        <input
          type="tel"
          inputMode="tel"
          placeholder="6123-4567"
          value={form.whatsapp}
          onChange={(e) => set('whatsapp', e.target.value)}
        />
        <small>Aquí te llegan los pedidos y los comprobantes de Yappy.</small>
      </label>

      <div className="section-title">Aviso de ventas por Telegram</div>

      <div className="note">
        Cada pedido te llega al instante a Telegram, lo haga quien lo haga y desde el celular que
        sea. Es tu constancia de venta diaria.
      </div>

      <ol className="steps">
        <li>
          En Telegram busca <b>@BotFather</b> y escríbele <b>/newbot</b>. Te devuelve un{' '}
          <b>token</b> largo.
        </li>
        <li>
          Busca <b>@userinfobot</b> y escríbele <b>/start</b>. Te devuelve tu <b>Chat ID</b>.
        </li>
        <li>Pega los dos aquí abajo y dale a Probar.</li>
        <li>
          <b>Escríbele algo a tu bot</b> (un &quot;hola&quot;) o no te podrá enviar mensajes.
        </li>
      </ol>

      <label className="field">
        <span>Token del bot</span>
        <input
          type="text"
          autoComplete="off"
          spellCheck="false"
          placeholder="123456789:AAE..."
          value={form.telegramToken}
          onChange={(e) => set('telegramToken', e.target.value.trim())}
        />
      </label>

      <label className="field">
        <span>Tu Chat ID</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="987654321"
          value={form.telegramChatId}
          onChange={(e) => set('telegramChatId', e.target.value.trim())}
        />
      </label>

      <div className="adminbar">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={probarTelegram}
          disabled={probando || !telegramListo(form)}
        >
          {probando ? 'Enviando…' : 'Probar ahora'}
        </button>
      </div>

      <div className="note" style={{ borderLeftColor: 'var(--danger)' }}>
        <b>Ten esto en cuenta:</b> el token viaja dentro de la app publicada, porque el aviso sale
        del celular del cliente. Alguien que revise el código de tu sitio podría encontrarlo y
        mandarte <b>ventas falsas</b>. No da acceso a tu Telegram ni a tu dinero, y lo anulas en
        segundos con <b>/revoke</b> en @BotFather.
      </div>

      <div className="section-title">Precios</div>

      <div className="row2">
        <label className="field">
          <span>Moneda</span>
          <input maxLength={6} value={form.moneda} onChange={(e) => set('moneda', e.target.value)} />
        </label>

        <label className="field">
          <span>Costo de entrega</span>
          <input
            type="number"
            step="0.25"
            min="0"
            value={form.delivery}
            onChange={(e) => set('delivery', e.target.value)}
          />
          <small>0 = entrega gratis</small>
        </label>
      </div>

      <div className="row2">
        <label className="field">
          <span>Pedido mínimo</span>
          <input
            type="number"
            step="0.5"
            min="0"
            value={form.minimoPedido}
            onChange={(e) => set('minimoPedido', e.target.value)}
          />
          <small>0 = sin mínimo</small>
        </label>

        <label className="field">
          <span>Tasa ITBMS (%)</span>
          <input
            type="number"
            step="1"
            min="0"
            max="20"
            value={form.itbmsTasa}
            onChange={(e) => set('itbmsTasa', e.target.value)}
          />
        </label>
      </div>

      <label className="switch">
        <input
          type="checkbox"
          checked={form.itbmsActivo}
          onChange={(e) => set('itbmsActivo', e.target.checked)}
        />
        <span>
          Cobrar ITBMS aparte
          <small>Déjalo apagado si tus precios ya lo incluyen</small>
        </span>
      </label>

      <div className="section-title">Seguridad</div>

      <label className="field">
        <span>PIN del panel</span>
        <input
          inputMode="numeric"
          maxLength={12}
          value={form.pin}
          onChange={(e) => set('pin', e.target.value)}
        />
        <small>Sólo evita toques accidentales. No es seguridad real.</small>
      </label>

      <button className="btn btn--block" type="submit">
        Guardar ajustes
      </button>
    </form>
  )
}
