import { supabase } from './supabase'

// Función para generar un QR code único
export function generateQRCode(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000000)
  return `AFTR-${timestamp}-${random.toString().padStart(6, '0')}`
}

// Función para crear tickets cuando se aprueba un purchase_request
export async function createTicketsForPurchaseRequest(
  purchaseRequestId: number,
  userId: string,
  tableId: string,
  names: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[createTicketsForPurchaseRequest] Iniciando...')
    console.log('[createTicketsForPurchaseRequest] Parámetros:', { purchaseRequestId, userId, tableId, names })

    if (!names || names.length === 0) {
      console.error('[createTicketsForPurchaseRequest] No hay nombres para crear tickets')
      return { success: false, error: 'No hay nombres para crear tickets' }
    }

    // Crear un ticket por cada nombre
    const tickets = names.map((name) => ({
      purchase_request_id: purchaseRequestId,
      user_id: userId,
      qr_code: generateQRCode(),
      cover_name: name.trim(),
      table_id: tableId,
      status: 'approved' as const,
    }))

    console.log('[createTicketsForPurchaseRequest] Tickets a crear:', tickets.length)
    console.log('[createTicketsForPurchaseRequest] Insertando tickets...')

    const { data, error: insertError } = await supabase
      .from('tickets')
      .insert(tickets)
      .select()

    console.log('[createTicketsForPurchaseRequest] Respuesta de inserción recibida')
    console.log('[createTicketsForPurchaseRequest] Data:', data)
    console.log('[createTicketsForPurchaseRequest] Error:', insertError)

    if (insertError) {
      console.error('[createTicketsForPurchaseRequest] Error al crear tickets:', insertError)
      console.error('[createTicketsForPurchaseRequest] Detalles:', JSON.stringify(insertError, null, 2))
      return { success: false, error: insertError.message }
    }

    console.log('[createTicketsForPurchaseRequest] Tickets creados exitosamente:', data?.length || 0)
    return { success: true }
  } catch (error: any) {
    console.error('[createTicketsForPurchaseRequest] Excepción capturada:', error)
    console.error('[createTicketsForPurchaseRequest] Stack:', error.stack)
    return { success: false, error: error.message }
  }
}

// Función para obtener tickets de un usuario
export async function getUserTickets(userId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      purchase_requests (
        id,
        table_id,
        quantity,
        total_price,
        status,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener tickets:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Función para escanear un ticket (usado por admin)
export async function scanTicket(qrCode: string, scannedBy: string) {
  try {
    // Buscar el ticket por QR code
    const { data: ticket, error: findError } = await supabase
      .from('tickets')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (findError || !ticket) {
      return { success: false, error: 'Ticket no encontrado' }
    }

    if (ticket.status === 'used') {
      return { success: false, error: 'Este ticket ya fue utilizado' }
    }

    if (ticket.status !== 'approved') {
      return { success: false, error: 'Este ticket no está aprobado' }
    }

    // Actualizar el ticket como usado
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        scanned_at: new Date().toISOString(),
        scanned_by: scannedBy,
      })
      .eq('id', ticket.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, ticket }
  } catch (error: any) {
    console.error('Error en scanTicket:', error)
    return { success: false, error: error.message }
  }
}

