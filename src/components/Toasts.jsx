import { useStore } from '../store/StoreContext.jsx'

/** Avisos breves en la esquina. Se quitan solos desde el store. */
export default function Toasts() {
  const { avisos } = useStore()
  if (!avisos.length) return null

  return (
    <div className="toasts" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className={`toast toast--${a.tipo}`}>
          {a.mensaje}
        </div>
      ))}
    </div>
  )
}
