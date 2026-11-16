/* ═══════════════════════════════════════════════════════════
   Manejo de las fotos de productos.

   Una foto de celular pesa 3–5 MB. localStorage aguanta ~5 MB en
   total, así que sin comprimir bastan dos fotos para que la app deje
   de guardar. Todo lo que entra pasa por aquí primero.
   ═══════════════════════════════════════════════════════════ */

/**
 * Reduce la imagen a un cuadrado de `lado` px (recorte centrado, tipo
 * "cover") y la devuelve como dataURL JPEG.
 *
 * @param {File}   file     archivo elegido por el usuario
 * @param {number} lado     píxeles del cuadrado final
 * @param {number} calidad  0–1, compresión JPEG
 * @returns {Promise<string>} dataURL lista para guardar
 */
export function comprimirImagen(file, lado = 420, calidad = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No se eligió ningún archivo.'))
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Ese archivo no es una imagen.'))
    }

    const lector = new FileReader()
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    lector.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagen dañada o en un formato no soportado.'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = lado
        canvas.height = lado
        const ctx = canvas.getContext('2d')

        // Fondo blanco: los PNG con transparencia quedarían negros en JPEG.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, lado, lado)

        // Recorte centrado al cuadrado más grande que quepa.
        const corte = Math.min(img.width, img.height)
        const sx = (img.width - corte) / 2
        const sy = (img.height - corte) / 2
        ctx.drawImage(img, sx, sy, corte, corte, 0, 0, lado, lado)

        resolve(canvas.toDataURL('image/jpeg', calidad))
      }
      img.src = lector.result
    }
    lector.readAsDataURL(file)
  })
}

/** Peso aproximado en KB de una dataURL, para avisar si se va de tamaño. */
export function pesoDataUrl(dataUrl) {
  if (!dataUrl) return 0
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.round((base64.length * 3) / 4 / 1024)
}
