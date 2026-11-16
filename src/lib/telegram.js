/* ═══════════════════════════════════════════════════════════
   Aviso de ventas por Telegram.

   El mensaje sale del celular donde se hizo el pedido —normalmente el
   del cliente—, no del tuyo. Es la única forma de enterarte de un pedido
   hecho desde otro teléfono, porque la app no tiene servidor propio.

   Como consecuencia, el token viaja dentro de la app publicada y es
   visible para quien mire el código. Lo peor que puede hacer alguien con
   él es mandarte mensajes falsos; se revoca al instante con @BotFather.
   ═══════════════════════════════════════════════════════════ */

const API = 'https://api.telegram.org'

/** ¿Está configurado el aviso? */
export function telegramListo(settings) {
  return Boolean(settings?.telegramToken && settings?.telegramChatId)
}

/**
 * Manda un mensaje al chat configurado.
 * Devuelve { ok, error } — nunca lanza: un fallo de red no debe
 * romperle el pedido al cliente.
 */
export async function enviarTelegram(settings, texto) {
  if (!telegramListo(settings)) return { ok: false, error: 'Sin configurar' }

  try {
    const resp = await fetch(`${API}/bot${settings.telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    const data = await resp.json().catch(() => null)
    if (!resp.ok || !data?.ok) {
      return { ok: false, error: data?.description || `HTTP ${resp.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message || 'Sin conexión' }
  }
}

function escapar(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Da formato al pedido para Telegram, con HTML (negritas y monoespaciado).
 * Pensado para leerse de un vistazo en la notificación del celular.
 */
export function mensajePedido(pedido, settings, money) {
  const L = []
  const hora = new Date(pedido.fecha).toLocaleTimeString('es-PA', {
    hour: '2-digit', minute: '2-digit',
  })

  L.push(`🛒 <b>NUEVA VENTA</b> · ${escapar(money(pedido.total))}`)
  L.push('')
  L.push(`<code>${escapar(pedido.codigo)}</code> · ${hora}`)
  L.push(pedido.pago === 'yappy' ? '💳 Pago: <b>Yappy</b>' : '💵 Pago: <b>Efectivo</b>')
  L.push('')

  pedido.items.forEach((l) => {
    L.push(`• ${l.qty}× ${escapar(l.nombre)} — ${escapar(money(l.subtotal))}`)
  })

  L.push('')
  if (pedido.itbms > 0) L.push(`ITBMS: ${escapar(money(pedido.itbms))}`)
  if (pedido.envio > 0) L.push(`Entrega: ${escapar(money(pedido.envio))}`)
  L.push(`<b>TOTAL: ${escapar(money(pedido.total))}</b>`)

  // Nombre, celular y nota son opcionales en el formulario.
  const extra = []
  if (pedido.cliente?.nombre) extra.push(`👤 ${escapar(pedido.cliente.nombre)}`)
  if (pedido.cliente?.telefono) extra.push(`📞 ${escapar(pedido.cliente.telefono)}`)
  if (pedido.cliente?.nota) extra.push(`📝 ${escapar(pedido.cliente.nota)}`)
  if (extra.length) {
    L.push('')
    L.push(extra.join('\n'))
  }

  if (pedido.pago === 'yappy') {
    L.push('')
    L.push('⚠️ <i>Verifica en tu app de Yappy antes de entregar.</i>')
  }

  return L.join('\n')
}

/** Mensaje de prueba, para el botón "Probar" de Ajustes. */
export function mensajePrueba(settings) {
  return [
    '✅ <b>MovilDrink conectado</b>',
    '',
    `Los pedidos de <b>${escapar(settings.nombre || 'MovilDrink')}</b> te van a llegar aquí.`,
  ].join('\n')
}
