import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider } from './store/StoreContext.jsx'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
)

/* Service worker: hace que la app abra sin internet.
   Sólo funciona servida por http(s), no abriendo el archivo con doble clic.
   En desarrollo se salta, para no cachear código que estás cambiando. */
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((e) => console.warn('[MovilDrink] service worker no registrado:', e))
  })
}
