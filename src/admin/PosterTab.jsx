import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { useStore } from '../store/StoreContext.jsx'
import { telBonito } from '../lib/format.js'

/**
 * Genera el cartel que va detrás del asiento del copiloto.
 *
 * Lleva DOS códigos QR, y la diferencia importa:
 *  1. El de la app  — lo genera esta pantalla a partir de tu enlace.
 *  2. El de Yappy   — es el tuyo, el que subiste en Ajustes.
 *
 * Son dos porque el celular del cliente no puede escanear su propia
 * pantalla: para pagar necesita un QR físico al que apuntar.
 */
export default function PosterTab() {
  const { settings, guardarSettings, toast } = useStore()

  const [url, setUrl] = useState(settings.urlPublica || '')
  const [qrApp, setQrApp] = useState('')
  const [error, setError] = useState('')

  /* Genera el QR cada vez que cambia el enlace guardado. */
  useEffect(() => {
    const destino = settings.urlPublica
    if (!destino) {
      setQrApp('')
      return
    }
    let cancelado = false
    QRCode.toDataURL(destino, {
      width: 900,          // grande: se va a imprimir
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then((d) => {
        if (!cancelado) setQrApp(d)
      })
      .catch((e) => {
        if (!cancelado) setError(e.message)
      })
    return () => {
      cancelado = true
    }
  }, [settings.urlPublica])

  function guardarUrl(e) {
    e.preventDefault()
    const limpia = url.trim()
    if (limpia && !/^https?:\/\//i.test(limpia)) {
      setError('El enlace tiene que empezar por https://')
      return
    }
    setError('')
    guardarSettings({ urlPublica: limpia })
    toast(limpia ? 'Enlace guardado' : 'Enlace borrado')
  }

  const listo = Boolean(settings.urlPublica)

  return (
    <>
      <div className="section-title">Cartel para el auto</div>

      <div className="note">
        Imprime esto y pégalo detrás del asiento del copiloto. El cliente escanea, pide desde su
        celular y te paga, sin que tengas que explicarle nada.
      </div>

      {/* noValidate: sin esto el navegador bloquea el envío con su propio
          aviso en inglés y nunca se ve el mensaje de abajo. */}
      <form onSubmit={guardarUrl} noValidate>
        <label className={`field${error ? ' field--error' : ''}`}>
          <span>Enlace de tu app publicada</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://movildrink-panama.netlify.app"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError('')
            }}
          />
          {error ? (
            <span className="err">{error}</span>
          ) : (
            <small>El que te dio Netlify. Cópialo del navegador y pégalo aquí.</small>
          )}
        </label>
        <button className="btn btn--sm" type="submit">
          Guardar y generar QR
        </button>
      </form>

      {!listo && (
        <p className="empty" style={{ paddingBottom: 0 }}>
          <span aria-hidden="true">🖨️</span>
          Pega tu enlace arriba para ver el cartel.
        </p>
      )}

      {listo && (
        <>
          <div className="adminbar" style={{ marginTop: 18 }}>
            <button className="btn btn--sm" onClick={() => window.print()}>
              Imprimir cartel
            </button>
            <a className="btn btn--ghost btn--sm" href={qrApp} download="qr-movildrink.png">
              Descargar sólo el QR
            </a>
          </div>

          {!settings.yappyQR && (
            <div className="note" style={{ borderLeftColor: 'var(--danger)' }}>
              Te falta subir tu <b>código QR de Yappy</b> en la pestaña Ajustes. Sin él, el cliente
              tendrá que teclear tu número a mano para pagarte.
            </div>
          )}

          {/* ───── El cartel. Es lo único que sale al imprimir. ───── */}
          <div className="poster">
            <div className="poster__top">
              <h2>{settings.nombre || 'MovilDrink'}</h2>
              <p>{settings.eslogan || 'Bebidas y confituras'}</p>
            </div>

            <div className="poster__step">
              <span className="poster__num">1</span>
              <div>
                <h3>Mira el menú y pide</h3>
                <p>Apunta la cámara de tu celular aquí</p>
              </div>
            </div>

            {qrApp && <img className="poster__qr" src={qrApp} alt="Código QR del menú" />}

            <div className="poster__step">
              <span className="poster__num">2</span>
              <div>
                <h3>Paga con Yappy</h3>
                <p>Escanea desde tu app del banco</p>
              </div>
            </div>

            {settings.yappyQR ? (
              <img className="poster__qr poster__qr--yappy" src={settings.yappyQR} alt="Código QR de Yappy" />
            ) : (
              <div className="poster__falta">Pega aquí tu QR de Yappy</div>
            )}

            <div className="poster__yappy">
              {settings.yappyNumero && (
                <>
                  <span>O yappea al</span>
                  <strong>{telBonito(settings.yappyNumero)}</strong>
                  {settings.yappyNombre && <span>{settings.yappyNombre}</span>}
                </>
              )}
            </div>

            <p className="poster__pie">
              Pon el <b>código de tu pedido</b> en la descripción del Yappy 🇵🇦
            </p>
          </div>
        </>
      )}
    </>
  )
}
