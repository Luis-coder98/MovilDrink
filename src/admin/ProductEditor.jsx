import { useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { CATEGORIAS, EMOJIS } from '../data/seed.js'
import { comprimirImagen, pesoDataUrl } from '../lib/image.js'
import Modal, { ModalConfirmar } from '../components/Modal.jsx'

/**
 * Alta y edición de un producto: nombre, descripción, precio, stock,
 * categoría, ícono, foto y visibilidad.
 *
 * `producto = null` significa "crear uno nuevo".
 */
export default function ProductEditor({ producto, onCerrar }) {
  const { settings, agregarProducto, actualizarProducto, borrarProducto, toast } = useStore()
  const esNuevo = !producto

  const [form, setForm] = useState(() => ({
    nombre: producto?.nombre ?? '',
    desc: producto?.desc ?? '',
    // Con dos decimales se lee como dinero: "1.00" en vez de "1".
    precio: producto ? producto.precio.toFixed(2) : '',
    stock: producto?.stock ?? '',
    cat: producto?.cat ?? 'bebidas',
    emoji: producto?.emoji ?? '🥤',
    img: producto?.img ?? '',
    activo: producto?.activo ?? true,
  }))
  const [errores, setErrores] = useState({})
  const [subiendo, setSubiendo] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  async function alElegirFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true)
    try {
      const dataUrl = await comprimirImagen(file, 420, 0.78)
      set('img', dataUrl)
      toast(`Foto lista (${pesoDataUrl(dataUrl)} KB)`)
    } catch (err) {
      toast(err.message, 'err')
    } finally {
      setSubiendo(false)
      e.target.value = ''   // permite volver a elegir el mismo archivo
    }
  }

  function guardar(e) {
    e.preventDefault()

    const err = {}
    if (!form.nombre.trim()) err.nombre = 'Ponle un nombre.'
    const precio = parseFloat(form.precio)
    if (!Number.isFinite(precio) || precio < 0) err.precio = 'Precio inválido.'
    const stock = parseInt(form.stock, 10)
    if (!Number.isFinite(stock) || stock < 0) err.stock = 'Stock inválido.'

    setErrores(err)
    if (Object.keys(err).length) return

    const datos = { ...form, nombre: form.nombre.trim(), desc: form.desc.trim(), precio, stock }

    if (esNuevo) {
      agregarProducto(datos)
      toast('Producto agregado')
    } else {
      actualizarProducto(producto.id, datos)
      toast('Producto actualizado')
    }
    onCerrar()
  }

  return (
    <>
      <Modal titulo={esNuevo ? 'Nuevo producto' : 'Editar producto'} onCerrar={onCerrar}>
        <form onSubmit={guardar} noValidate>
          <label className={`field${errores.nombre ? ' field--error' : ''}`}>
            <span>Nombre *</span>
            <input
              type="text"
              maxLength={70}
              placeholder="Ej. Coca-Cola 500 ml"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
            />
            {errores.nombre && <span className="err">{errores.nombre}</span>}
          </label>

          <label className="field">
            <span>Descripción corta</span>
            <input
              type="text"
              maxLength={70}
              placeholder="Ej. bien fría"
              value={form.desc}
              onChange={(e) => set('desc', e.target.value)}
            />
          </label>

          <div className="row2">
            <label className={`field${errores.precio ? ' field--error' : ''}`}>
              <span>Precio ({settings.moneda}) *</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.05"
                min="0"
                value={form.precio}
                onChange={(e) => set('precio', e.target.value)}
              />
              {errores.precio && <span className="err">{errores.precio}</span>}
            </label>

            <label className={`field${errores.stock ? ' field--error' : ''}`}>
              <span>Stock *</span>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
              />
              {errores.stock && <span className="err">{errores.stock}</span>}
            </label>
          </div>

          <label className="field">
            <span>Categoría</span>
            <select value={form.cat} onChange={(e) => set('cat', e.target.value)}>
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span>Ícono</span>
            <div className="emojipick">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-pressed={form.emoji === e}
                  aria-label={`Usar ${e}`}
                  onClick={() => set('emoji', e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Foto (opcional, reemplaza el ícono)</span>
            <input type="file" accept="image/*" onChange={alElegirFoto} disabled={subiendo} />
            <small>Se reduce a 420×420 px automáticamente para no llenar la memoria.</small>

            {subiendo && <small>Procesando imagen…</small>}

            {form.img && !subiendo && (
              <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={form.img}
                  alt=""
                  style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 12 }}
                />
                <div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-dim)' }}>
                    {pesoDataUrl(form.img)} KB
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    style={{ marginTop: 6 }}
                    onClick={() => set('img', '')}
                  >
                    Quitar foto
                  </button>
                </div>
              </div>
            )}
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => set('activo', e.target.checked)}
            />
            <span>
              Visible en el catálogo
              <small>Desmárcalo para ocultarlo sin borrarlo</small>
            </span>
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {!esNuevo && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmarBorrado(true)}
              >
                Borrar
              </button>
            )}
            <button className="btn" type="submit" style={{ flex: 1 }} disabled={subiendo}>
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {confirmarBorrado && (
        <ModalConfirmar
          titulo="Borrar producto"
          texto={`¿Seguro que quieres borrar "${producto.nombre}"? Los pedidos anteriores se conservan.`}
          textoBoton="Sí, borrar"
          onCerrar={() => setConfirmarBorrado(false)}
          onSi={() => {
            borrarProducto(producto.id)
            toast('Producto borrado')
            onCerrar()
          }}
        />
      )}
    </>
  )
}
