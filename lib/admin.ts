import { supabase } from './supabase'

// Función para obtener todos los purchase_requests pendientes
export async function getPendingPurchaseRequests() {
  try {
    // Obtener los purchase_requests directamente
    // IMPORTANTE: No hacer join con auth.users desde el cliente
    // Solo seleccionar campos de purchase_requests
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('id, user_id, table_id, quantity, names, total_price, proof_of_payment_url, status, created_at, updated_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener purchase requests:', error)
      console.error('Detalles del error:', JSON.stringify(error, null, 2))
      return { data: null, error }
    }

    if (!data || data.length === 0) {
      console.log('No se encontraron purchase requests pendientes')
      return { data: [], error: null }
    }

    // Agregar un objeto user con solo el id (el email se puede obtener después si es necesario)
    const dataWithUser = data.map(request => ({
      ...request,
      user: {
        id: request.user_id,
        email: null // No podemos obtener el email desde el cliente sin una función especial
      }
    }))

    console.log('Purchase requests obtenidos:', dataWithUser.length)
    return { data: dataWithUser, error: null }
  } catch (err: any) {
    console.error('Excepción al obtener purchase requests:', err)
    return { data: null, error: err }
  }
}

// Función para aprobar un purchase_request
export async function approvePurchaseRequest(
  purchaseRequestId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[approvePurchaseRequest] ========== INICIO ==========')
    console.log('[approvePurchaseRequest] ID recibido:', purchaseRequestId)
    console.log('[approvePurchaseRequest] Tipo de ID:', typeof purchaseRequestId)
    console.log('[approvePurchaseRequest] Cliente Supabase configurado:', !!supabase)
    console.log('[approvePurchaseRequest] URL de Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'NO CONFIGURADA')
    
    // NUEVA ESTRATEGIA: Usar función de base de datos con SECURITY DEFINER
    // Esto evita completamente los problemas de RLS
    console.log('[approvePurchaseRequest] ESTRATEGIA: Usar función de base de datos')
    console.log('[approvePurchaseRequest] PASO 1: Llamando a función approve_purchase_request...')
    console.log('[approvePurchaseRequest] - Función: approve_purchase_request')
    console.log('[approvePurchaseRequest] - Parámetro:', purchaseRequestId)
    
    const functionStartTime = Date.now()
    console.log('[approvePurchaseRequest] Ejecutando función...')
    
    // Llamar a la función de base de datos
    const functionQuery = supabase.rpc('approve_purchase_request', {
      request_id: purchaseRequestId
    })
    
    // Agregar timeout de 30 segundos (aumentado para debugging)
    const functionTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: La función tardó más de 30 segundos')), 30000)
    )
    
    let updatedData, functionError
    try {
      const functionResult = await Promise.race([functionQuery, functionTimeoutPromise]) as any
      const functionElapsedTime = Date.now() - functionStartTime
      console.log('[approvePurchaseRequest] Función completada en', functionElapsedTime, 'ms')
      
      updatedData = functionResult.data?.[0] || functionResult.data
      functionError = functionResult.error
      
      console.log('[approvePurchaseRequest] Resultado de la función:')
      console.log('[approvePurchaseRequest] - Data:', updatedData)
      console.log('[approvePurchaseRequest] - Error:', functionError)
    } catch (functionTimeoutError: any) {
      const functionElapsedTime = Date.now() - functionStartTime
      console.error('[approvePurchaseRequest] TIMEOUT en función después de', functionElapsedTime, 'ms')
      console.error('[approvePurchaseRequest] Error:', functionTimeoutError)
      return { success: false, error: functionTimeoutError.message || 'La función tardó demasiado.' }
    }

    if (functionError) {
      console.error('[approvePurchaseRequest] ✗ Error al ejecutar función:')
      console.error('[approvePurchaseRequest] - Código:', functionError.code)
      console.error('[approvePurchaseRequest] - Mensaje:', functionError.message)
      console.error('[approvePurchaseRequest] - Detalles:', JSON.stringify(functionError, null, 2))
      return { success: false, error: `Error al aprobar: ${functionError.message}` }
    }

    if (!updatedData) {
      console.error('[approvePurchaseRequest] ✗ No se actualizó ningún registro')
      console.error('[approvePurchaseRequest] Esto puede significar:')
      console.error('[approvePurchaseRequest] - El ID no existe')
      console.error('[approvePurchaseRequest] - El status no es "pending" (ya fue procesado)')
      return { success: false, error: 'No se encontró el registro o ya fue procesado.' }
    }

    console.log('[approvePurchaseRequest] ✓ Purchase request actualizado exitosamente:')
    console.log('[approvePurchaseRequest] - ID:', updatedData.id)
    console.log('[approvePurchaseRequest] - User ID:', updatedData.user_id)
    console.log('[approvePurchaseRequest] - Table ID:', updatedData.table_id)
    console.log('[approvePurchaseRequest] - Quantity:', updatedData.quantity)
    console.log('[approvePurchaseRequest] - Names:', updatedData.names)

    // Validar que hay nombres
    console.log('[approvePurchaseRequest] Validando nombres...')
    const names = updatedData.names || []
    console.log('[approvePurchaseRequest] - Cantidad de nombres:', names.length)
    console.log('[approvePurchaseRequest] - Nombres:', names)
    
    if (names.length === 0) {
      console.error('[approvePurchaseRequest] ✗ No hay nombres para crear tickets')
      // Revertir el status usando la función o UPDATE directo
      await supabase
        .from('purchase_requests')
        .update({ status: 'pending' })
        .eq('id', purchaseRequestId)
      return { success: false, error: 'No hay nombres para crear tickets' }
    }
    console.log('[approvePurchaseRequest] ✓ Nombres validados correctamente')

    // PASO 2: Crear los tickets
    console.log('[approvePurchaseRequest] PASO 2: Creando tickets...')
    console.log('[approvePurchaseRequest] - Purchase Request ID:', purchaseRequestId)
    console.log('[approvePurchaseRequest] - User ID:', updatedData.user_id)
    console.log('[approvePurchaseRequest] - Table ID:', updatedData.table_id)
    console.log('[approvePurchaseRequest] - Nombres:', names)
    
    console.log('[approvePurchaseRequest] Importando función createTicketsForPurchaseRequest...')
    const { createTicketsForPurchaseRequest } = await import('./tickets')
    console.log('[approvePurchaseRequest] Función importada, llamando...')
    
    const ticketsStartTime = Date.now()
    const result = await createTicketsForPurchaseRequest(
      purchaseRequestId,
      updatedData.user_id,
      updatedData.table_id,
      names
    )
    const ticketsElapsedTime = Date.now() - ticketsStartTime
    console.log('[approvePurchaseRequest] Creación de tickets completada en', ticketsElapsedTime, 'ms')
    console.log('[approvePurchaseRequest] Resultado:', result)

    if (!result.success) {
      console.error('[approvePurchaseRequest] ✗ Error al crear tickets, revirtiendo status...')
      // Si falla la creación de tickets, revertir el status
      const revertResult = await supabase
        .from('purchase_requests')
        .update({ status: 'pending' })
        .eq('id', purchaseRequestId)
      console.log('[approvePurchaseRequest] Status revertido:', revertResult.error ? 'ERROR' : 'OK')
      if (revertResult.error) {
        console.error('[approvePurchaseRequest] Error al revertir:', revertResult.error)
      }
      return result
    }

    console.log('[approvePurchaseRequest] ========== ÉXITO ==========')
    console.log('[approvePurchaseRequest] ✓ Proceso completado exitosamente')
    return { success: true }
  } catch (error: any) {
    console.error('[approvePurchaseRequest] ========== EXCEPCIÓN ==========')
    console.error('[approvePurchaseRequest] ✗ Excepción capturada:', error)
    console.error('[approvePurchaseRequest] - Tipo:', typeof error)
    console.error('[approvePurchaseRequest] - Mensaje:', error.message)
    console.error('[approvePurchaseRequest] - Stack:', error.stack)
    console.error('[approvePurchaseRequest] - Error completo:', JSON.stringify(error, null, 2))
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

// Función para rechazar un purchase_request
export async function rejectPurchaseRequest(
  purchaseRequestId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[rejectPurchaseRequest] Iniciando, ID:', purchaseRequestId)
    
    // Intentar actualizar directamente sin verificar primero
    // Esto es más eficiente y evita problemas de RLS
    console.log('[rejectPurchaseRequest] Actualizando status directamente a rejected...')
    const { data, error } = await supabase
      .from('purchase_requests')
      .update({ status: 'rejected' })
      .eq('id', purchaseRequestId)
      .eq('status', 'pending') // Solo actualizar si está pendiente
      .select()

    console.log('[rejectPurchaseRequest] Respuesta recibida')
    console.log('[rejectPurchaseRequest] Data:', data)
    console.log('[rejectPurchaseRequest] Error:', error)

    if (error) {
      console.error('[rejectPurchaseRequest] Error al actualizar:', error)
      console.error('[rejectPurchaseRequest] Detalles del error:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message || 'Error desconocido al rechazar' }
    }

    if (!data || data.length === 0) {
      console.error('[rejectPurchaseRequest] No se actualizó ningún registro')
      console.error('[rejectPurchaseRequest] Esto puede significar que el registro no existe o ya fue procesado')
      return { success: false, error: 'No se pudo actualizar el registro. Puede que ya haya sido procesado.' }
    }

    console.log('[rejectPurchaseRequest] Purchase request rechazado exitosamente:', data)
    return { success: true }
  } catch (error: any) {
    console.error('[rejectPurchaseRequest] Excepción capturada:', error)
    console.error('[rejectPurchaseRequest] Stack:', error.stack)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

// Función para obtener todos los tickets (para admin)
export async function getAllTickets() {
  // Simplificar la consulta para evitar problemas con foreign keys
  // Solo obtenemos los campos que necesitamos directamente de tickets
  const { data, error } = await supabase
    .from('tickets')
    .select('id, qr_code, cover_name, table_id, status, scanned_at, scanned_by, created_at, user_id, purchase_request_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener tickets:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Función para mover un cover de una mesa a otra
export async function moveCoverToTable(
  ticketId: number,
  newTableId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[moveCoverToTable] Moviendo cover:', { ticketId, newTableId })
    
    // Asegurar que el table_id tenga el formato correcto
    const formattedTableId = newTableId.startsWith('mesa-') ? newTableId : `mesa-${newTableId}`
    
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ table_id: formattedTableId })
      .eq('id', ticketId)

    if (updateError) {
      console.error('[moveCoverToTable] Error al actualizar:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log('[moveCoverToTable] Cover movido exitosamente')
    return { success: true }
  } catch (error: any) {
    console.error('[moveCoverToTable] Excepción:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

