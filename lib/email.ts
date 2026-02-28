import { Resend } from 'resend'
import { eventConfig } from './event-config'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const resend = resendApiKey ? new Resend(resendApiKey) : null

export function isEmailConfigured(): boolean {
  return !!resend
}

export type SendTicketApprovedOptions = {
  eventName?: string
}

/**
 * Envía un correo al usuario indicando que su ticket fue aprobado.
 * Si Resend no está configurado (RESEND_API_KEY), no hace nada y no lanza error.
 */
export async function sendTicketApprovedEmail(
  to: string,
  options: SendTicketApprovedOptions = {}
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: 'Email no configurado (RESEND_API_KEY)' }
  }

  const eventName = options.eventName ?? eventConfig.event.name

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Tu ticket está aprobado – ${eventConfig.brand}`,
      html: `
        <p>Hola,</p>
        <p>Tu solicitud de tickets para <strong>${eventName}</strong> ha sido aprobada.</p>
        <p>Ya puedes ver y usar tus tickets en la sección <strong>Mis Tickets</strong> de la página.</p>
        <p>Gracias,<br/><strong>${eventConfig.brand}</strong></p>
      `,
    })

    if (error) {
      console.error('[email] Error al enviar ticket aprobado:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[email] Excepción al enviar ticket aprobado:', message)
    return { success: false, error: message }
  }
}
