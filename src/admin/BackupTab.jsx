import { useRef, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { fechaArchivo, fechaLarga } from '../lib/format.js'
import { descargarArchivo } from '../lib/hooks.js'
import { ModalConfirmar } from '../components/Modal.jsx'

/** Respaldos, reporte de ventas en CSV y reinicio total. */
export default function BackupTab() {
  const { exportar, exportarCatalogo, importar, reiniciar, pedidos, productos, settings, toast } = useStore()
  const inputArchivo = useRef(null)
  const [confirmarReset, setConfirmarReset] = useState(false)

  function descargarRespaldo() {
    descargarArchivo(`movildrink-respaldo-${fechaArchivo()}.json`, exportar(), 'application/json')
    toast('Respaldo descargado')
  }

  /* El archivo tiene que llamarse exactamente catalogo.json: es el
     nombre que la app busca al arrancar. */
  function descargarCatalogo() {
    descargarArchivo('catalogo.json', exportarCatalogo(), 'application/json')
    toast('catalogo.json descargado')
  }

  const listoParaPublicar = Boolean(settings.yappyNumero) && Boolean(settings.whatsapp)

  function alElegirArchivo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const lector = new FileReader()
    lector.onload = () => {
      try {
        importar(lector.result)
        toast('Respaldo restaurado')
      } catch (err) {
        toast(err.message || 'Archivo inválido', 'err')
      }
      e.target.value = ''
    }
    lector.readAsText(file)
  }

  /** Una fila por línea de pedido, para abrirlo en Excel. */
  function descargarCsv() {
    const campo = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const filas = [
      ['Codigo', 'Fecha', 'Cliente', 'Telefono', 'Pago', 'Estado',
       'Producto', 'Cantidad', 'Precio', 'Subtotal', 'Total pedido'].join(','),
    ]
    pedidos.forEach((o) => {
      o.items.forEach((l) => {
        filas.push([
          campo(o.codigo), campo(fechaLarga(o.fecha)), campo(o.cliente.nombre),
          campo(o.cliente.telefono), campo(o.pago), campo(o.estado),
          campo(l.nombre), l.qty, l.precio.toFixed(2), l.subtotal.toFixed(2), o.total.toFixed(2),
        ].join(','))
      })
    })
    // BOM al inicio para que Excel en Windows lea bien los acentos.
    const csv = String.fromCharCode(0xfeff) + filas.join('\r\n')
    descargarArchivo(`movildrink-ventas-${fechaArchivo()}.csv`, csv, 'text/csv')
    toast('CSV descargado')
  }

  return (
    <>
      <div className="section-title">Publicar tu catálogo</div>

      <div className="note">
        Tus productos y precios viven <b>en este dispositivo</b>. Para que tus clientes vean{' '}
        <b>tu</b> catálogo y no el de ejemplo, descarga este archivo y publícalo junto a la app.
      </div>

      {!listoParaPublicar && (
        <div className="note" style={{ borderLeftColor: 'var(--danger)' }}>
          Antes de publicar, completa en <b>Ajustes</b> tu{' '}
          {!settings.yappyNumero && <b>número de Yappy</b>}
          {!settings.yappyNumero && !settings.whatsapp && ' y tu '}
          {!settings.whatsapp && <b>WhatsApp</b>}. Sin eso tus clientes no podrán pagarte ni
          avisarte.
        </div>
      )}

      <div className="adminbar">
        <button className="btn btn--sm" onClick={descargarCatalogo}>
          Descargar catalogo.json
        </button>
      </div>

      <ol className="steps" style={{ marginBottom: 22 }}>
        <li>
          Guarda el archivo dentro de la carpeta <b>public/</b> del proyecto.
        </li>
        <li>
          En la terminal: <b>npm run build</b>
        </li>
        <li>
          Sube de nuevo la carpeta <b>dist</b> a Netlify.
        </li>
      </ol>

      <div className="note">
        Incluye {productos.length} productos, tus ajustes de Yappy y —si lo configuraste— tu token
        de Telegram, que hace falta para que el celular del cliente pueda avisarte. <b>No</b>{' '}
        incluye tus pedidos ni tu PIN.
      </div>

      <div className="section-title">Respaldo completo</div>

      <div className="note">
        MovilDrink guarda todo <b>en este dispositivo</b>. Si borras los datos del navegador o
        cambias de teléfono, se pierde. Descarga un respaldo de vez en cuando.
      </div>

      <div className="adminbar">
        <button className="btn btn--sm" onClick={descargarRespaldo}>
          Descargar respaldo
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => inputArchivo.current?.click()}>
          Restaurar respaldo
        </button>
        <input
          ref={inputArchivo}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={alElegirArchivo}
        />
      </div>

      <div className="section-title">Reportes</div>
      <div className="adminbar">
        <button className="btn btn--ghost btn--sm" onClick={descargarCsv} disabled={!pedidos.length}>
          Exportar ventas (CSV)
        </button>
      </div>

      <div className="section-title">Zona peligrosa</div>
      <button className="btn btn--danger btn--sm" onClick={() => setConfirmarReset(true)}>
        Borrar todo y empezar de cero
      </button>

      {confirmarReset && (
        <ModalConfirmar
          titulo="Borrar todo"
          texto="Se borran productos, pedidos y ajustes, y vuelve el catálogo de ejemplo. Esto no se puede deshacer."
          textoBoton="Sí, borrar todo"
          onCerrar={() => setConfirmarReset(false)}
          onSi={() => {
            reiniciar()
            toast('Todo reiniciado')
          }}
        />
      )}
    </>
  )
}
