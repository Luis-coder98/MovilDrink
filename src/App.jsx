import { useState, useMemo, useEffect } from 'react'
import { useStore } from './store/StoreContext.jsx'
import { CATEGORIAS } from './data/seed.js'
import { norm } from './lib/format.js'
import { useTheme, useHashRoute, useEsPantallaAncha } from './lib/hooks.js'

import Header from './components/Header.jsx'
import Cart, { CartBar } from './components/Cart.jsx'
import Toasts from './components/Toasts.jsx'
import CheckoutForm from './components/CheckoutForm.jsx'
import YappyPayment from './components/YappyPayment.jsx'
import { ModalConfirmar } from './components/Modal.jsx'

import Catalog from './pages/Catalog.jsx'
import Orders from './pages/Orders.jsx'
import AdminPanel from './admin/AdminPanel.jsx'

export default function App() {
  const { settings, productosVisibles, vaciarCarrito, toast } = useStore()

  const [tema, alternarTema] = useTheme()
  const [vista, navegar] = useHashRoute()
  const esAncha = useEsPantallaAncha()

  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [carritoAbierto, setCarritoAbierto] = useState(false)

  // Flujo de pago: null → 'form' → pedido confirmado
  const [pasoPago, setPasoPago] = useState(null)
  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)

  /* El título de la pestaña sigue al nombre del negocio. */
  useEffect(() => {
    document.title = `${settings.nombre || 'MovilDrink'} · Bebidas y confituras`
  }, [settings.nombre])

  /* En laptop el carrito está siempre a la vista: la hoja sobra. */
  useEffect(() => {
    if (esAncha) setCarritoAbierto(false)
  }, [esAncha])

  /* El carrito fijo de laptop se posiciona debajo del encabezado, cuya
     altura cambia según la vista (el buscador y los chips sólo salen en
     el catálogo). Lo medimos y lo publicamos como variable CSS. */
  useEffect(() => {
    const topbar = document.querySelector('.topbar')
    if (!topbar) return
    const medir = () =>
      document.documentElement.style.setProperty('--header-h', `${topbar.offsetHeight}px`)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(topbar)
    return () => ro.disconnect()
  }, [vista])

  /* Atajo "/" para saltar al buscador, como en las apps de escritorio. */
  useEffect(() => {
    const alTeclear = (e) => {
      const escribiendo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (e.key === '/' && vista === 'catalogo' && !escribiendo) {
        e.preventDefault()
        document.querySelector('.search input')?.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [vista])

  /* Categorías con su conteo, sin mostrar las vacías. */
  const categorias = useMemo(() => {
    const conteo = {}
    productosVisibles.forEach((p) => {
      conteo[p.cat] = (conteo[p.cat] || 0) + 1
    })
    return [
      { id: 'todas', nombre: 'Todo', emoji: '', conteo: productosVisibles.length },
      ...CATEGORIAS.filter((c) => conteo[c.id]).map((c) => ({ ...c, conteo: conteo[c.id] })),
    ]
  }, [productosVisibles])

  /* Filtrado del catálogo: categoría + búsqueda sin acentos. */
  const filtrados = useMemo(() => {
    const q = norm(busqueda).trim()
    const palabras = q ? q.split(/\s+/) : []
    return productosVisibles
      .filter((p) => {
        if (categoria !== 'todas' && p.cat !== categoria) return false
        if (!palabras.length) return true
        const heno = norm(`${p.nombre} ${p.desc} ${p.cat}`)
        return palabras.every((w) => heno.includes(w))
      })
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  }, [productosVisibles, categoria, busqueda])

  const cerrarPago = () => {
    setPasoPago(null)
    setPedidoActivo(null)
  }

  return (
    <>
      <Header
        tema={tema}
        alternarTema={alternarTema}
        vista={vista}
        navegar={navegar}
        onAbrirCarrito={() => (esAncha ? null : setCarritoAbierto(true))}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        categoria={categoria}
        setCategoria={setCategoria}
        categorias={categorias}
      />

      <div className="layout">
        <main className="main">
          {vista === 'catalogo' && <Catalog productos={filtrados} />}

          {vista === 'pedidos' && (
            <Orders
              navegar={navegar}
              onVerPago={(o) => {
                setPedidoActivo(o)
                setPasoPago('pago')
              }}
            />
          )}

          {vista === 'admin' && <AdminPanel navegar={navegar} />}
        </main>

        {/* El carrito sólo estorba dentro del panel del vendedor. */}
        {vista !== 'admin' && (
          <Cart
            abierto={carritoAbierto}
            esAncha={esAncha}
            onCerrar={() => setCarritoAbierto(false)}
            onPagar={() => {
              setCarritoAbierto(false)
              setPasoPago('form')
            }}
            onVaciar={() => setConfirmarVaciar(true)}
          />
        )}
      </div>

      {/* Fondo oscuro detrás de la hoja del carrito, sólo en celular */}
      {carritoAbierto && !esAncha && (
        <div className="scrim" onClick={() => setCarritoAbierto(false)} />
      )}

      {vista !== 'admin' && !carritoAbierto && !esAncha && (
        <CartBar onAbrir={() => setCarritoAbierto(true)} />
      )}

      <footer className="foot">
        <button className="linkbtn" onClick={() => navegar('admin')}>
          Panel del vendedor
        </button>
        <span className="foot__sep">·</span>
        <span>{settings.nombre || 'MovilDrink'}</span>
        <span className="foot__sep">·</span>
        <span>Panamá 🇵🇦</span>
      </footer>

      {pasoPago === 'form' && (
        <CheckoutForm
          onCerrar={cerrarPago}
          onConfirmado={(pedido) => {
            setPedidoActivo(pedido)
            setPasoPago('pago')
          }}
        />
      )}

      {pasoPago === 'pago' && pedidoActivo && (
        <YappyPayment
          pedido={pedidoActivo}
          onCerrar={cerrarPago}
          onListo={() => {
            cerrarPago()
            navegar('pedidos')
          }}
        />
      )}

      {confirmarVaciar && (
        <ModalConfirmar
          titulo="Vaciar pedido"
          texto="¿Quitar todos los productos del carrito?"
          textoBoton="Vaciar"
          onCerrar={() => setConfirmarVaciar(false)}
          onSi={() => {
            vaciarCarrito()
            toast('Pedido vaciado')
          }}
        />
      )}

      <Toasts />
    </>
  )
}
