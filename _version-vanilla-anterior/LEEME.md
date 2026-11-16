# MovilDrink 🚗🥤

App de bebidas y confituras para vender desde tu auto, en Panamá.
Catálogo, carrito, pedidos y cobro por **Yappy**.

Funciona en **celular Android, iPhone, tablet y laptop** con el mismo código.
Se puede **instalar como app** y **abre sin internet**.

No necesita servidor, base de datos ni instalar nada: son archivos HTML, CSS y
JavaScript. Los datos se guardan en el propio dispositivo.

---

## 1. Probarla ahora mismo

Doble clic en **`iniciar.bat`**.

Se abre sola en el navegador y la ventana negra te muestra una dirección tipo
`http://192.168.x.x:8080`. Esa dirección la puedes abrir **desde tu celular**
(conectado al mismo WiFi) para probarla en el teléfono de verdad.

Deja la ventana negra abierta mientras uses la app. Para cerrarla: `Ctrl + C`.

> `iniciar.bat` usa el Python que ya tienes instalado. Es sólo para probar en
> casa; para el uso real conviene publicarla (paso 3).

---

## 2. Configúrala antes de vender

Abre la app → abajo del todo, **«Panel del vendedor»** → PIN **`1234`**.

### Pestaña «Ajustes» — hazlo en este orden

| Campo | Qué poner |
|---|---|
| **Número Yappy** | Tu celular asociado a Yappy, ej. `6123-4567` |
| **Nombre en Yappy** | Cómo te aparece al cliente, ej. `Luis G.` |
| **Código QR de Yappy** | Captura de pantalla del QR desde tu app de Yappy |
| **WhatsApp del negocio** | Ahí te llegan los pedidos y los comprobantes |
| **PIN del panel** | ⚠️ Cámbialo, no dejes `1234` |
| **Abierto ahora** | Apágalo cuando no estés rodando |
| **Costo de entrega** | `0` = gratis |
| **Pedido mínimo** | `0` = sin mínimo |
| **Cobrar ITBMS aparte** | Déjalo **apagado** si tus precios ya lo incluyen |

### Pestaña «Productos»

Viene con 33 productos de ejemplo con precios de referencia. **Ajústalos a los
tuyos**: toca *Editar* en cada uno, o *+ Nuevo producto*.

- **Reponer stock** te deja actualizar las cantidades de todo el catálogo en una
  sola pantalla — úsalo cada mañana antes de salir.
- Puedes ponerle **foto** a cada producto (se reduce sola para no llenar la
  memoria) o dejar el emoji.
- Desmarcar *«Visible en el catálogo»* lo esconde sin borrarlo.

---

## 3. Publicarla en internet (recomendado)

Para que tus clientes la abran desde su casa necesitas una dirección web.
La forma más rápida y gratis:

1. Entra a **<https://app.netlify.com/drop>**
2. Arrastra la carpeta `MovilDrink` completa a esa página.
3. En segundos te da un enlace tipo `https://movildrink-abc123.netlify.app`.
4. Comparte ese enlace por WhatsApp, o ponlo en tu bio de Instagram.

Alternativas iguales de válidas: GitHub Pages, Vercel, Cloudflare Pages.

> **Importante:** publicada con `https://` es cuando funciona el *instalar como
> app* y el *modo sin internet*. Abriendo el archivo con doble clic no.

### Instalarla como app

- **Android / Chrome:** menú ⋮ → *Instalar aplicación*
- **iPhone / Safari:** botón Compartir → *Agregar a pantalla de inicio*
- **Laptop / Chrome o Edge:** ícono de instalar en la barra de direcciones

Queda con su ícono, sin barra del navegador, como cualquier app.

---

## 4. Cómo funciona una venta

**El cliente:**
1. Elige productos con el botón `+`.
2. Toca *Ver pedido* → *Continuar al pago*.
3. Pone nombre, celular y dirección; elige **Yappy** o efectivo.
4. Le sale el monto exacto, tu número Yappy, tu QR y un **código de pedido**
   (`MD-260816-A4K`).
5. Yappea desde su banco poniendo ese código en la descripción.
6. Toca *«Ya yappeé · avisar por WhatsApp»* → te llega el pedido completo a tu
   WhatsApp.

**Tú:**
1. Verificas en tu app de Yappy que llegó el monto con ese código.
2. Panel del vendedor → **Pedidos** → cambias el estado a *Pagado* y luego a
   *Entregado*.

El stock se descuenta solo al confirmar el pedido. Si cancelas un pedido, el
stock se devuelve.

---

## 5. Respaldos ⚠️ importante

**Los datos viven sólo en el dispositivo donde abriste la app.** Si borras los
datos del navegador o cambias de teléfono, se pierden.

Panel del vendedor → **Respaldo** → *Descargar respaldo* (archivo `.json`).
Hazlo cada cierto tiempo y guárdalo en tu Drive. Para volver: *Restaurar
respaldo*.

Ahí mismo puedes **exportar tus ventas a CSV** para abrirlas en Excel.

---

## 6. Detalles que conviene saber

- **El PIN no es seguridad real.** Todo corre en el navegador del cliente; sólo
  evita que alguien toque los precios desde tu propio teléfono. No guardes nada
  sensible.
- **La app no verifica los pagos.** Yappy no ofrece una forma pública de
  confirmar transferencias a un número personal, así que **siempre revisa tu app
  de Yappy antes de entregar**. La app te da el monto y un código para que sea
  fácil cruzarlo.
- **El botón «Abrir la app de Yappy»** intenta abrir Yappy directamente. No
  todos los teléfonos lo permiten; por eso el número siempre queda copiado y
  visible para que el cliente lo pegue.
- Si más adelante vendes bastante, existe el *Botón de Pago Yappy* de Banco
  General, que sí confirma los pagos automáticamente. Requiere cuenta comercial
  y un pequeño servidor.

---

## 7. Si cambias algo del código

Al editar los archivos, los celulares que ya abrieron la app pueden seguir
viendo la versión vieja (queda guardada para funcionar sin internet).

Abre `sw.js` y súbele el número:

```js
var CACHE_VERSION = 'movildrink-v2';   // era v1
```

Vuelve a publicar y todos reciben la versión nueva.

---

## 8. Qué hay en cada archivo

```
MovilDrink/
├── index.html            Estructura de la pantalla
├── iniciar.bat           Arranca el servidor de prueba
├── manifest.webmanifest  Datos para instalarla como app
├── sw.js                 Hace que funcione sin internet
├── css/styles.css        Todo el diseño (colores, tamaños, responsive)
├── icons/                Íconos de la app
└── js/
    ├── config.js         ⭐ Catálogo inicial, categorías y valores por defecto
    ├── store.js          Datos, carrito, totales, pedidos, respaldos
    ├── ui.js             Dibuja catálogo y carrito
    ├── checkout.js       Formulario, pago con Yappy, WhatsApp
    ├── admin.js          Panel del vendedor
    └── app.js            Arranque, navegación, tema claro/oscuro
```

Si quieres cambiar los productos de fábrica, edita `js/config.js`. Pero para el
día a día es más cómodo hacerlo desde el Panel del vendedor.

Para cambiar los colores, en `css/styles.css` están arriba del todo:

```css
--brand:  #0d9488;   /* turquesa principal */
--accent: #f59e0b;   /* ámbar de los avisos */
```
