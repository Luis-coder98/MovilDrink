# Publicar MovilDrink 🚀

Guía para poner la app en internet: que tus clientes la abran desde su
teléfono y que la tengas en la tablet del auto.

---

## ⚠️ Antes que nada: el paso que casi todos olvidan

MovilDrink guarda tus productos **en el navegador donde los editaste**.

Si publicas sin más, tus clientes verían el **catálogo de ejemplo** con los
precios de fábrica — no los tuyos. Por eso el paso 2 de abajo no es opcional.

---

## Los 5 pasos

### 1 · Configura tu negocio

Arranca la app (`npm run dev`), entra al **Panel del vendedor** (PIN `1234`) y:

- **Ajustes** → tu número de Yappy, tu nombre en Yappy, tu WhatsApp, y **cambia
  el PIN**.
- **Productos** → ajusta precios, stock y fotos a lo que realmente vendes.
  Borra los de ejemplo que no uses.

### 2 · Empaqueta tu catálogo

Panel → **Respaldo** → botón **«Descargar catalogo.json»**.

Mueve ese archivo a la carpeta **`public/`** del proyecto:

```
MovilDrink/
└── public/
    ├── catalogo.json     ← aquí
    ├── manifest.webmanifest
    ├── sw.js
    └── icons/
```

> El archivo lleva tus productos y tus datos de Yappy. **No** lleva tus pedidos
> ni tu PIN, porque queda público en internet.

### 3 · Compila

```bash
npm run build
```

Genera la carpeta **`dist/`**. Ésa es la que se publica — no el proyecto entero.

### 4 · Súbela

Entra a **<https://app.netlify.com/drop>** y arrastra la carpeta **`dist`**.

En unos segundos te da un enlace:

```
https://movildrink-abc123.netlify.app
```

Créate la cuenta gratis cuando te lo ofrezca (si no, el sitio se borra a las
24 h) y desde el panel de Netlify puedes cambiarle el nombre a algo como
`movildrink-panama.netlify.app`.

Alternativas iguales de válidas y gratis: Vercel, Cloudflare Pages, GitHub Pages.

### 5 · Compártelo

Ese enlace es tu tienda. Ponlo en tu estado de WhatsApp, en la bio de
Instagram, o imprímelo como QR y pégalo en el auto.

Para hacer el QR: <https://www.qr-code-generator.com> — pegas el enlace y
descargas la imagen.

---

## Cuando cambies precios o productos

Repite los pasos **2 → 3 → 4**. Nada más.

Netlify: arrastra la nueva carpeta `dist` sobre el mismo sitio y se reemplaza.

Los clientes que ya habían entrado **reciben el catálogo nuevo solos** la
próxima vez que abran la app. No tienen que borrar nada.

> Ojo: publicar de nuevo **sobrescribe** el stock en todos los dispositivos,
> incluida tu tablet. Si llevas el stock del día en la tablet, publica al
> empezar la jornada y no a media tarde.

---

## 🔔 Aviso de ventas por Telegram

Es lo que te da **constancia de cada venta**, la haga quien la haga y desde el
celular que sea. Sin esto, un pedido hecho desde el teléfono de un cliente se
queda guardado sólo en su teléfono y tú nunca te enteras.

Configúralo en **Panel → Ajustes → Aviso de ventas por Telegram**:

1. En Telegram busca **@BotFather**, escríbele `/newbot` y ponle un nombre.
   Te devuelve un **token** largo (algo como `123456789:AAE-xxxxx`).
2. Busca **@userinfobot**, escríbele `/start`. Te devuelve tu **Chat ID**
   (un número).
3. Pega los dos en Ajustes y dale a **Probar ahora**.
4. **Escríbele algo a tu bot** (un simple "hola"). Telegram no deja que un bot
   te escriba primero si tú nunca le hablaste.
5. Guarda los ajustes, y vuelve a publicar (pasos 2 → 3 → 4 de arriba) para que
   los clientes lo lleven.

Cada venta te llega así:

```
🛒 NUEVA VENTA · B/. 4.25

MD-260817-A1B · 03:45 p. m.
💳 Pago: Yappy

• 2× Coca-Cola lata 355 ml — B/. 2.00
• 1× Snickers — B/. 1.25
• 1× Agua purificada 600 ml — B/. 0.75

TOTAL: B/. 4.25

👤 Ana

⚠️ Verifica en tu app de Yappy antes de entregar.
```

> **Lo que debes saber:** el token viaja dentro de la app publicada, porque el
> aviso lo manda el celular del cliente. Alguien que revise el código de tu
> sitio podría encontrarlo y mandarte **ventas falsas**. No da acceso a tu
> Telegram ni a tu dinero. Si pasa, escríbele `/revoke` a @BotFather y el token
> viejo deja de servir al instante.

Si un aviso no sale (al cliente se le cayó el internet), el pedido igual se
guarda y en **Panel → Pedidos** aparece marcado como **«Sin avisar»**, con un
botón para reenviarlo.

## 🖨️ El cartel del asiento

Panel del vendedor → pestaña **Cartel QR**.

Pega ahí el enlace que te dio Netlify y le das a *Guardar y generar QR*. Te arma
un cartel listo para imprimir, con **dos códigos QR**:

1. **El de tu menú** — lo genera la app a partir de tu enlace. El cliente lo
   escanea con la cámara y se le abre tu catálogo.
2. **El de tu Yappy** — es el que subiste en Ajustes. El cliente lo escanea
   *desde su app del banco* y Yappy se abre contigo ya seleccionado.

Botón **Imprimir cartel** y listo. Pégalo detrás del asiento del copiloto, a la
altura de los ojos de quien va sentado atrás.

> **Por qué son dos QR y no uno.** El celular del cliente no puede escanear su
> propia pantalla. Si el botón de pago viviera sólo dentro de la app, el cliente
> tendría que teclear tu número a mano. Con el QR de Yappy impreso al lado,
> apunta la cámara y Yappy se abre solo.

Consejos de impresión:

- Tamaño carta, a color si puedes (el QR de Yappy es más fácil de reconocer).
- **Plastifícalo o métele cinta transparente encima**: dentro del auto le va a
  dar sol y se despinta.
- Antes de pegarlo, **escanea los dos QR con tu propio celular** para confirmar
  que funcionan.

## 📱 La tablet del auto

Una vez publicada:

1. Abre el enlace en la tablet, con Chrome.
2. Menú ⋮ → **Instalar aplicación** (o *Agregar a pantalla de inicio*).
3. Ábrela desde su ícono: se ve a pantalla completa, sin barra del navegador.

**Para que el cliente no se salga de la app** (Android):

- *Ajustes → Seguridad → Fijar pantalla* (o *Anclar app*). La activas, abres
  MovilDrink y la fijas. Para salir se necesita tu patrón o PIN.
- En *Ajustes → Pantalla* sube el tiempo de apagado, para que no se apague
  mientras el cliente elige.

**Importante sobre la tablet:** los pedidos que se hagan ahí quedan guardados
**en la tablet**, y los ves en su propio Panel del vendedor. No aparecen en tu
celular — cada dispositivo lleva los suyos. Por eso conviene que el cliente
igual toque *«Ya yappeé · avisar por WhatsApp»*: así el pedido te llega al
teléfono.

Y sube el PIN del panel antes de dejar la tablet en manos de clientes.

---

## Qué NO hace la app

Que quede claro para que no te lleves una sorpresa:

- **No cobra ni verifica pagos.** El cliente yappea por su cuenta a tu número.
  **Siempre revisa tu app de Yappy antes de entregar.** El código de pedido
  (`MD-260816-A4K`) está para que cruzarlo sea rápido.
- **No sincroniza dispositivos.** Tu celular, tu laptop y la tablet llevan cada
  uno sus propios pedidos. Lo único compartido es el catálogo publicado.
- **No descuenta stock entre dispositivos.** Si vendes lo último desde la
  tablet, tu celular no se entera.

Para tener eso hace falta un servidor y una base de datos. Si el negocio crece
y empieza a hacerte falta, el siguiente paso natural es Supabase o Firebase
(ambos con plan gratis), más el *Botón de Pago Yappy* de Banco General, que sí
confirma los pagos solo pero pide cuenta comercial.

---

## Si algo sale mal

**«Los clientes ven el catálogo de ejemplo»**
Te faltó el paso 2, o guardaste `catalogo.json` con otro nombre. Tiene que
llamarse exactamente así y estar en `public/`.

**«Cambié precios y no se ven»**
¿Descargaste el `catalogo.json` nuevo y volviste a compilar? El archivo viejo
sigue ahí hasta que lo reemplaces.

**«La página sale en blanco»**
Casi siempre es haber subido la carpeta del proyecto en vez de `dist`.

**«No me sale “Instalar aplicación”»**
Sólo aparece en sitios con `https://`. En `npm run dev` no sale, es normal.
