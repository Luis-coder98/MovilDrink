/* ═══════════════════════════════════════════════════════════
   MovilDrink · config.js
   Valores por defecto y catálogo semilla.
   Todo esto se puede cambiar después desde el Panel del vendedor;
   lo de aquí sólo se usa la primera vez que se abre la app.
   ═══════════════════════════════════════════════════════════ */

window.MD = window.MD || {};

MD.VERSION = '1.0.0';
MD.STORAGE_KEY = 'movildrink.v1';

/* --- Configuración del negocio --- */
MD.DEFAULT_SETTINGS = {
  nombre:      'MovilDrink',
  eslogan:     'Bebidas y confituras · a tu puerta',
  moneda:      'B/.',            // Balboa panameño
  yappyNumero: '',               // ej. '6123-4567' — el número Yappy del vendedor
  yappyNombre: '',               // nombre que aparece en Yappy al recibir
  yappyQR:     '',               // imagen (dataURL) del QR de Yappy, opcional
  whatsapp:    '',               // ej. '50761234567' (con código de país, sin +)
  itbmsActivo: false,            // ITBMS 7%: por defecto apagado
  itbmsTasa:   7,
  delivery:    0,                // costo fijo de entrega, 0 = gratis
  minimoPedido: 0,               // monto mínimo, 0 = sin mínimo
  aceptaEfectivo: true,
  pin:         '1234',           // PIN del panel del vendedor
  abierto:     true,             // interruptor "cerrado por hoy"
  mensajeCerrado: 'Hoy no estamos rodando. ¡Vuelve mañana!'
};

/* --- Categorías --- */
MD.CATEGORIAS = [
  { id: 'bebidas',    nombre: 'Bebidas',    emoji: '🥤' },
  { id: 'aguas',      nombre: 'Aguas',      emoji: '💧' },
  { id: 'energeticas',nombre: 'Energéticas',emoji: '⚡' },
  { id: 'confituras', nombre: 'Confituras', emoji: '🍬' },
  { id: 'snacks',     nombre: 'Snacks',     emoji: '🥨' },
  { id: 'combos',     nombre: 'Combos',     emoji: '🎁' }
];

/* --- Emojis sugeridos al crear productos --- */
MD.EMOJIS = [
  '🥤','🧃','💧','🍾','🥫','☕','🧋','🍹','🍺','⚡',
  '🍬','🍫','🍪','🍭','🍩','🧁','🍿','🥨','🥜','🍌',
  '🎁','🧊','🍊','🍋','🥛','🍦'
];

/* --- Catálogo semilla --- */
MD.SEED_PRODUCTOS = [
  // Aguas
  { nombre: 'Agua purificada 600 ml', cat: 'aguas', precio: 0.75, stock: 40, emoji: '💧', desc: 'Bien fría' },
  { nombre: 'Agua purificada 1.5 L',  cat: 'aguas', precio: 1.25, stock: 20, emoji: '💧', desc: 'Para compartir' },
  { nombre: 'Agua con gas 500 ml',    cat: 'aguas', precio: 1.50, stock: 12, emoji: '🫧', desc: '' },

  // Bebidas
  { nombre: 'Coca-Cola lata 355 ml',  cat: 'bebidas', precio: 1.00, stock: 36, emoji: '🥤', desc: 'Clásica' },
  { nombre: 'Coca-Cola 500 ml',       cat: 'bebidas', precio: 1.35, stock: 24, emoji: '🥤', desc: 'Botella' },
  { nombre: 'Pepsi lata 355 ml',      cat: 'bebidas', precio: 0.90, stock: 24, emoji: '🥤', desc: '' },
  { nombre: 'Sprite lata 355 ml',     cat: 'bebidas', precio: 0.90, stock: 24, emoji: '🥤', desc: 'Limón' },
  { nombre: 'Fanta naranja 355 ml',   cat: 'bebidas', precio: 0.90, stock: 18, emoji: '🍊', desc: '' },
  { nombre: 'Malta Vigor 250 ml',     cat: 'bebidas', precio: 1.10, stock: 18, emoji: '🍾', desc: '' },
  { nombre: 'Jugo Del Valle 500 ml',  cat: 'bebidas', precio: 1.25, stock: 16, emoji: '🧃', desc: 'Naranja o durazno' },
  { nombre: 'Té frío Lipton 500 ml',  cat: 'bebidas', precio: 1.25, stock: 14, emoji: '🧋', desc: 'Limón' },
  { nombre: 'Gatorade 600 ml',        cat: 'bebidas', precio: 1.75, stock: 15, emoji: '🍹', desc: 'Hidratante' },
  { nombre: 'Chicha de tamarindo',    cat: 'bebidas', precio: 1.00, stock: 10, emoji: '🥤', desc: 'Casera' },
  { nombre: 'Café frío 250 ml',       cat: 'bebidas', precio: 1.75, stock: 8,  emoji: '☕', desc: '' },

  // Energéticas
  { nombre: 'Red Bull 250 ml',        cat: 'energeticas', precio: 2.75, stock: 12, emoji: '⚡', desc: '' },
  { nombre: 'Monster 473 ml',         cat: 'energeticas', precio: 3.25, stock: 10, emoji: '⚡', desc: '' },

  // Confituras
  { nombre: 'Snickers',               cat: 'confituras', precio: 1.25, stock: 20, emoji: '🍫', desc: '' },
  { nombre: 'KitKat',                 cat: 'confituras', precio: 1.25, stock: 20, emoji: '🍫', desc: '' },
  { nombre: 'M&M\'s chocolate',       cat: 'confituras', precio: 1.50, stock: 16, emoji: '🍬', desc: '' },
  { nombre: 'Galletas Oreo',          cat: 'confituras', precio: 1.00, stock: 24, emoji: '🍪', desc: 'Paquete' },
  { nombre: 'Galletas Ducales',       cat: 'confituras', precio: 0.75, stock: 24, emoji: '🍪', desc: '' },
  { nombre: 'Bon Bon Bum',            cat: 'confituras', precio: 0.35, stock: 50, emoji: '🍭', desc: 'Unidad' },
  { nombre: 'Chicle Trident',         cat: 'confituras', precio: 0.75, stock: 30, emoji: '🍬', desc: '' },
  { nombre: 'Gomitas surtidas',       cat: 'confituras', precio: 1.00, stock: 18, emoji: '🍬', desc: '' },

  // Snacks
  { nombre: 'Papitas Margarita',      cat: 'snacks', precio: 1.00, stock: 22, emoji: '🥨', desc: 'Natural o limón' },
  { nombre: 'Doritos',                cat: 'snacks', precio: 1.25, stock: 20, emoji: '🥨', desc: 'Nacho' },
  { nombre: 'Cheetos',                cat: 'snacks', precio: 1.00, stock: 20, emoji: '🥨', desc: '' },
  { nombre: 'Platanitos',             cat: 'snacks', precio: 1.00, stock: 18, emoji: '🍌', desc: 'Verdes, crujientes' },
  { nombre: 'Maní salado',            cat: 'snacks', precio: 0.75, stock: 25, emoji: '🥜', desc: '' },
  { nombre: 'Palomitas',              cat: 'snacks', precio: 1.25, stock: 10, emoji: '🍿', desc: 'Mantequilla' },

  // Combos
  { nombre: 'Combo Refresco + Papitas', cat: 'combos', precio: 1.75, stock: 15, emoji: '🎁', desc: 'Ahorra B/. 0.25' },
  { nombre: 'Combo Agua + Maní',        cat: 'combos', precio: 1.35, stock: 15, emoji: '🎁', desc: 'Ligero y rápido' },
  { nombre: 'Combo Energía',            cat: 'combos', precio: 3.50, stock: 8,  emoji: '🎁', desc: 'Red Bull + chocolate' }
];

/* --- Estados de pedido --- */
MD.ESTADOS = {
  pendiente: { label: 'Pendiente de pago', tag: 'tag--pend' },
  pagado:    { label: 'Pagado',            tag: 'tag--pago' },
  entregado: { label: 'Entregado',         tag: 'tag--entr' },
  cancelado: { label: 'Cancelado',         tag: 'tag--canc' }
};
