import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
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

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Pago con tarjeta no configurado' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { table_id, quantity, names, total_price } = body as {
      table_id: string
      quantity: number
      names: string[]
      total_price: number
    }

    if (!table_id || !quantity || !names?.length || total_price == null || total_price < 1) {
      return NextResponse.json({ error: 'Datos de compra incompletos' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/$/, '') || ''
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            unit_amount: Math.round(total_price * 100),
            product_data: {
              name: `Covers - ${quantity} ${quantity === 1 ? 'cover' : 'covers'}`,
              description: `Mesa/área: ${table_id}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/compra/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/compra`,
      metadata: {
        user_id: user.id,
        table_id,
        quantity: String(quantity),
        names_json: JSON.stringify(names.slice(0, quantity)),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe create-checkout-session]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
