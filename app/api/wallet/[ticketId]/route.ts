import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PKPass } from 'passkit-generator'
import { eventConfig } from '@/lib/event-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const id = Number(ticketId)
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID de ticket inválido' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null

    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const refreshToken = request.headers.get('x-refresh-token')

    if (bearerToken) {
      const { data: { user: userFromToken } } = await supabase.auth.getUser(bearerToken)
      user = userFromToken
      if (user && refreshToken) {
        await supabase.auth.setSession({ access_token: bearerToken, refresh_token: refreshToken })
      }
    }
    if (!user) {
      const { data: { user: userFromCookies } } = await supabase.auth.getUser()
      user = userFromCookies
    }
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, qr_code, cover_name, table_id, status, user_id')
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }
    if (ticket.user_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para este ticket' }, { status: 403 })
    }
    if (ticket.status !== 'approved' && ticket.status !== 'used') {
      return NextResponse.json({ error: 'Este ticket no está aprobado' }, { status: 400 })
    }

    const signerCert = process.env.WALLET_SIGNER_CERT
    const signerKey = process.env.WALLET_SIGNER_KEY
    const wwdr = process.env.WALLET_WWDR
    const passTypeId = process.env.WALLET_PASS_TYPE_ID
    const teamId = process.env.WALLET_TEAM_ID
    const orgName = process.env.WALLET_ORG_NAME || eventConfig.brand

    if (!signerCert || !signerKey || !wwdr || !passTypeId || !teamId) {
      return NextResponse.json(
        { error: 'Wallet no configurado. Configura los certificados de Apple Wallet en el servidor.' },
        { status: 503 }
      )
    }

    const certificates = {
      wwdr: Buffer.from(wwdr, 'base64'),
      signerCert: Buffer.from(signerCert, 'base64'),
      signerKey: Buffer.from(signerKey, 'base64'),
    }

    const pass = new PKPass(
      {},
      certificates,
      {
        description: eventConfig.event.name,
        organizationName: orgName,
        passTypeIdentifier: passTypeId,
        teamIdentifier: teamId,
        serialNumber: String(ticket.id),
      }
    )

    pass.type = 'eventTicket'
    pass.setBarcodes(ticket.qr_code)
    pass.primaryFields.push(
      { key: 'event', label: 'Evento', value: eventConfig.event.name },
      { key: 'name', label: 'Titular', value: ticket.cover_name }
    )
    pass.secondaryFields.push(
      { key: 'table', label: 'Mesa', value: ticket.table_id.replace(/^mesa-/, '') }
    )

    const buffer = pass.getAsBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="ticket-${ticket.id}.pkpass"`,
      },
    })
  } catch (err) {
    console.error('[wallet] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al generar el pase' },
      { status: 500 }
    )
  }
}
