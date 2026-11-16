# MovilDrink 🚗🥤

App de bebidas y confituras para vender desde tu auto, en Panamá.
Catálogo, carrito, pedidos, **panel de administración** y cobro por **Yappy**.

Hecha con **React 19 + Vite**. Funciona en celular Android, iPhone, tablet y
laptop con el mismo código, se instala como app y abre sin internet.

---

## 1. Arrancarla

Abre una terminal en esta carpeta y escribe:

```bash
npm install     # sólo la primera vez
npm run dev
```

Te muestra dos direcciones:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/     ← ésta ábrela en tu celular
```

La de **Network** funciona desde tu teléfono si está en el mismo WiFi. Muy útil
para ver cómo queda de verdad en pantalla chica.

Mientras `npm run dev` esté corriendo, cualquier cambio que hagas al código se
ve en pantalla al instante, sin recargar.

---

## 2. Configúrala antes de vender

Abre la app → abajo del todo, **«Panel del vendedor»** → PIN **`1234`**.

### Pestaña «Ajustes»

| Campo | Qué poner |
|---|---|
| **Número Yappy** | Tu celular asociado a Yappy, ej. `6123-4567` |
| **Nombre en Yappy** | Cómo te ve el cliente, ej. `Luis G.` |
| **Código QR de Yappy** | Captura del QR desde tu app de Yappy |
| **WhatsApp del negocio** | Ahí te llegan los pedidos y comprobantes |
| **PIN del panel** | ⚠️ Cámbialo, no dejes `1234` |
| **Abierto ahora** | Apágalo cuando no estés rodando |
| **Costo de entrega** | `0` = gratis |
| **Pedido mínimo** | `0` = sin mínimo |
| **Cobrar ITBMS aparte** | Déjalo **apagado** si tus precios ya lo incluyen |

### Pestaña «Productos» — la administración del catálogo

Viene con 33 productos de ejemplo. **Ajusta los precios a los tuyos.**

- **Editar** en cada producto abre el editor completo: nombre, descripción,
  **precio**, stock, categoría, **ícono**, **foto** y si se ve o no.
- **+ Nuevo producto** para agregar los tuyos.
- **Reponer stock** actualiza las cantidades de todo el catálogo en una sola
  pantalla — úsalo cada mañana antes de salir.
- **↑ ↓** cambian el orden en que aparecen en la tienda.
- **Buscador y filtro por categoría** para encontrar rápido entre muchos.
- Desmarcar *«Visible en el catálogo»* lo esconde sin borrarlo.

**Sobre las fotos:** se reducen solas a 420×420 px al subirlas. Sin eso, tres
fotos de celular llenarían la memoria del navegador y la app dejaría de
guardar. El QR de Yappy se guarda más grande (640 px) para que se pueda
escanear.

### Pestaña «Pedidos»

Cada pedido con su cliente, dirección, nota y productos. Cambias el estado
(*Pendiente → Pagado → Entregado*) y le escribes por WhatsApp con un botón.
Arriba: ventas de hoy y cuánto tienes por cobrar.

> Cambiar un pedido a **Cancelado** devuelve el stock al inventario.
> **Borrarlo (✕)** sólo lo saca del historial y no devuelve nada.

---

## 3. Publicarla en internet

👉 **Guía completa paso a paso: [PUBLICAR.md](PUBLICAR.md)**

Resumen:

1. Configura tus productos y tu Yappy en el panel.
2. Panel → Respaldo → **Descargar catalogo.json** y ponlo en `public/`.
   ⚠️ Sin esto tus clientes ven el catálogo de ejemplo, no el tuyo.
3. `npm run build`
4. Arrastra la carpeta **`dist`** a <https://app.netlify.com/drop>

Igual de válidos: Vercel, GitHub Pages, Cloudflare Pages.

### Instalarla como app

- **Android / Chrome:** menú ⋮ → *Instalar aplicación*
- **iPhone / Safari:** Compartir → *Agregar a pantalla de inicio*
- **Laptop / Chrome o Edge:** ícono de instalar en la barra de direcciones

Queda con su ícono y sin barra del navegador. El modo sin internet sólo
funciona en la versión publicada con `https://`, no en `npm run dev`.

---

## 4. Cómo funciona una venta

**El cliente:**
1. Elige productos con `+`.
2. *Ver pedido* → *Continuar al pago*.
3. Nombre, celular, dirección; elige **Yappy** o efectivo.
4. Le sale el monto exacto, tu número, tu QR y un **código de pedido**
   (`MD-260816-A4K`).
5. Yappea desde su banco poniendo ese código en la descripción.
6. *«Ya yappeé · avisar por WhatsApp»* → te llega el pedido completo.

**Tú:** verificas en tu app de Yappy que llegó el monto con ese código, y en
**Pedidos** lo mueves a *Pagado* y luego a *Entregado*.

El stock se descuenta solo al confirmar el pedido.

---

## 5. Respaldos ⚠️

**Los datos viven sólo en el dispositivo donde abriste la app.** Si borras los
datos del navegador o cambias de teléfono, se pierden.

Panel → **Respaldo** → *Descargar respaldo* (`.json`). Guárdalo en tu Drive.
Ahí mismo puedes **exportar tus ventas a CSV** para Excel.

---

## 6. Detalles que conviene saber

- **El PIN no es seguridad real.** Todo corre en el navegador del cliente; sólo
  evita que alguien toque los precios desde tu propio teléfono.
- **La app no verifica los pagos.** Yappy no ofrece una forma pública de
  confirmar transferencias a un número personal, así que **siempre revisa tu
  app de Yappy antes de entregar**. El código de pedido está para que cruzarlo
  sea rápido.
- **«Abrir la app de Yappy»** intenta abrir Yappy directamente. No todos los
  teléfonos lo permiten; por eso el número siempre queda copiado y a la vista.
- Si más adelante vendes bastante, existe el *Botón de Pago Yappy* de Banco
  General, que sí confirma los pagos automáticamente. Requiere cuenta comercial
  y un servidor propio.

---

## 7. Estructura del proyecto

```
MovilDrink/
├── package.json          Dependencias y comandos
├── vite.config.js        Configuración del compilador
├── index.html            Página base (React se monta aquí)
├── public/               Se copia tal cual a dist/
│   ├── manifest.webmanifest
│   ├── sw.js             Funcionamiento sin internet
│   └── icons/
├── dist/                 ⬅ lo que se publica (lo genera npm run build)
└── src/
    ├── main.jsx          Punto de entrada
    ├── App.jsx           Arma la pantalla y decide qué vista mostrar
    ├── styles.css        Todo el diseño
    │
    ├── data/seed.js      ⭐ Catálogo inicial, categorías y valores por defecto
    │
    ├── store/
    │   └── StoreContext.jsx   ⭐ Estado de toda la app (productos, carrito,
    │                             pedidos, ajustes) y su guardado
    ├── lib/
    │   ├── format.js     Dinero, teléfonos panameños, totales
    │   ├── image.js      Compresión de fotos
    │   └── hooks.js      Tema, rutas, media queries
    │
    ├── components/
    │   ├── Header.jsx          Barra superior, buscador y categorías
    │   ├── ProductCard.jsx     Tarjeta de producto
    │   ├── Cart.jsx            Carrito y barra flotante
    │   ├── CheckoutForm.jsx    Datos del pedido
    │   ├── YappyPayment.jsx    Pantalla de pago
    │   ├── Modal.jsx           Ventanas emergentes
    │   ├── Toasts.jsx          Avisos
    │   └── Iconos.jsx          Íconos SVG
    │
    ├── pages/
    │   ├── Catalog.jsx   Rejilla de productos
    │   └── Orders.jsx    Mis pedidos (vista del cliente)
    │
    └── admin/            ⭐ PANEL DE ADMINISTRACIÓN
        ├── AdminPanel.jsx    PIN y pestañas
        ├── ProductsTab.jsx   Inventario, buscador, orden
        ├── ProductEditor.jsx Editar precio, foto, stock, categoría
        ├── StockEditor.jsx   Reponer stock masivo
        ├── OrdersTab.jsx     Pedidos recibidos
        ├── SettingsTab.jsx   Ajustes y Yappy
        └── BackupTab.jsx     Respaldos y CSV
```

### Cambios comunes

**Colores** — arriba de `src/styles.css`:

```css
--brand:  #0d9488;   /* turquesa principal */
--accent: #f59e0b;   /* ámbar de los avisos */
```

**Categorías** — en `src/data/seed.js`, arreglo `CATEGORIAS`.

**Productos de fábrica** — `SEED_PRODUCTOS` en el mismo archivo. Ojo: sólo
aplica en un navegador que nunca abrió la app. Para el día a día usa el panel.

---

## 8. Versión anterior

La carpeta `_version-vanilla-anterior/` tiene la primera versión, sin React
(HTML, CSS y JS puro). Ya no se usa; puedes borrarla cuando quieras.
