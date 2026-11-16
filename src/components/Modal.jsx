import { useEffect, useRef } from 'react'
import { useBloquearScroll } from '../lib/hooks.js'
import { IconoX } from './Iconos.jsx'

/**
 * Ventana modal reutilizable.
 * En celular sube desde abajo; en pantallas grandes queda centrada.
 */
export default function Modal({ titulo, onCerrar, children, ancho }) {
  const caja = useRef(null)
  useBloquearScroll(true)

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  // Lleva el foco al primer control para teclado y lectores de pantalla.
  useEffect(() => {
    const primero = caja.current?.querySelector(
      'input:not([type=hidden]), select, textarea, button'
    )
    primero?.focus({ preventScroll: true })
  }, [])

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onMouseDown={(e) => {
        // Sólo cierra si el clic empezó en el fondo, no dentro de la caja.
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="modal__box" ref={caja} style={ancho ? { maxWidth: ancho } : undefined}>
        <div className="modal__head">
          <h2>{titulo}</h2>
          <button className="iconbtn" type="button" onClick={onCerrar} aria-label="Cerrar">
            <IconoX />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

/** Diálogo de confirmación para acciones que no se pueden deshacer. */
export function ModalConfirmar({ titulo, texto, textoBoton = 'Sí, continuar', onSi, onCerrar }) {
  return (
    <Modal titulo={titulo} onCerrar={onCerrar} ancho={430}>
      <p>{texto}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn--ghost" style={{ flex: 1 }} onClick={onCerrar}>
          Cancelar
        </button>
        <button
          className="btn btn--danger"
          style={{ flex: 1 }}
          onClick={() => {
            onSi()
            onCerrar()
          }}
        >
          {textoBoton}
        </button>
      </div>
    </Modal>
  )
}
