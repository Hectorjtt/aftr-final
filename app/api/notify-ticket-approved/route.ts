import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseService } from '@/lib/supabase-service'
import { sendTicketApprovedEmail } from '@/lib/email'

/**
 * POST: envía correo al usuario indicando que su ticket fue aprobado.
 * Solo puede ser llamado por un admin (tras aprobar desde el dashboard).
 * No modifica el flujo de aprobación: si el envío falla, se responde 200 igual.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
    if (bearerToken) {
      const { data: { user: u } } = await supabase.auth.getUser(bearerToken)
      user = u ?? null
    }
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser()
      user = u ?? null
    }
    if (!user) {
      console.log('[notify-ticket-approved] No autorizado: no hay sesión (envía el token en Authorization: Bearer desde el cliente)')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Comprobar rol con service role (evita que RLS bloquee la lectura de user_roles)
    if (!supabaseService) {
      return NextResponse.json({ ok: true })
    }
    const { data: roleRow } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (roleRow?.role !== 'admin') {
      console.log('[notify-ticket-approved] 403: usuario no es admin, user_id:', user.id)
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const purchaseRequestId = typeof body.purchaseRequestId === 'number'
      ? body.purchaseRequestId
      : parseInt(String(body.purchaseRequestId), 10)
    if (!Number.isFinite(purchaseRequestId)) {
      return NextResponse.json({ error: 'purchaseRequestId inválido' }, { status: 400 })
    }

    console.log('[notify-ticket-approved] Llamada recibida, purchaseRequestId:', purchaseRequestId)

    if (!supabaseService) {
      console.log('[notify-ticket-approved] SUPABASE_SERVICE_ROLE_KEY no configurado, no se puede obtener email')
      return NextResponse.json({ ok: true })
    }

    const { data: pr } = await supabaseService
      .from('purchase_requests')
      .select('user_id')
      .eq('id', purchaseRequestId)
      .maybeSingle()
    if (!pr?.user_id) {
      console.log('[notify-ticket-approved] No se encontró la solicitud o user_id, id:', purchaseRequestId)
      return NextResponse.json({ ok: true })
    }

    const { data: userRole } = await supabaseService
      .from('user_roles')
      .select('email')
      .eq('user_id', pr.user_id)
      .maybeSingle()
    const email = userRole?.email?.trim()
    if (!email) {
      console.log('[notify-ticket-approved] No hay email en user_roles para user_id:', pr.user_id, '- El usuario debe tener email guardado al registrarse')
      return NextResponse.json({ ok: true })
    }

    console.log('[notify-ticket-approved] Enviando correo a:', email)
    const result = await sendTicketApprovedEmail(email)
    if (result.success) {
      console.log('[notify-ticket-approved] Correo enviado correctamente')
    } else {
      console.log('[notify-ticket-approved] Error al enviar:', result.error)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notify-ticket-approved] Excepción:', err)
    return NextResponse.json({ ok: true })
  }
}
