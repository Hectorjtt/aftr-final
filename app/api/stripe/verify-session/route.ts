import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Falta session_id' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe no configurado' }, { status: 503 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'El pago no está completado' }, { status: 400 })
    }

    const metadata = session.metadata
    if (!metadata?.user_id || !metadata?.table_id || !metadata?.quantity || !metadata?.names_json) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 400 })
    }

    let names: string[]
    try {
      names = JSON.parse(metadata.names_json)
    } catch {
      return NextResponse.json({ error: 'Datos de sesión inválidos' }, { status: 400 })
    }

    const quantity = parseInt(metadata.quantity, 10) || 0
    if (quantity < 1 || !Array.isArray(names) || names.length < quantity) {
      return NextResponse.json({ error: 'Datos de compra inválidos' }, { status: 400 })
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
    if (!user || user.id !== metadata.user_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { data: existing } = await supabase
      .from('purchase_requests')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ success: true })
    }

    const reference = session.id.slice(-9).replace(/\D/g, '') || String(Math.floor(10000 + Math.random() * 90000))

    const { error } = await supabase.from('purchase_requests').insert({
      stripe_session_id: sessionId,
      user_id: metadata.user_id,
      table_id: metadata.table_id,
      quantity,
      names: names.slice(0, quantity),
      proof_of_payment_url: null,
      total_price: (session.amount_total ?? 0) / 100,
      status: 'pending',
      reference,
      payment_method: 'card',
    })

    if (error) {
      if (error.code === '23505') {
        const ref2 = String(Math.floor(10000 + Math.random() * 90000))
        const { error: retryError } = await supabase.from('purchase_requests').insert({
          stripe_session_id: sessionId,
          user_id: metadata.user_id,
          table_id: metadata.table_id,
          quantity,
          names: names.slice(0, quantity),
          proof_of_payment_url: null,
          total_price: (session.amount_total ?? 0) / 100,
          status: 'pending',
          reference: ref2,
          payment_method: 'card',
        })
        if (retryError) {
          console.error('[stripe verify-session] insert error:', retryError)
          return NextResponse.json({ error: 'Error al guardar la solicitud' }, { status: 500 })
        }
      } else {
        console.error('[stripe verify-session] insert error:', error)
        return NextResponse.json({ error: 'Error al guardar la solicitud' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[stripe verify-session]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al verificar el pago' },
      { status: 500 }
    )
  }
}
