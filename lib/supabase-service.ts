import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service role. Solo usar en el servidor (API routes).
 * Ignora RLS para que todos los usuarios (incl. recién registrados) vean los mismos conteos del mapa.
 */
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export const supabaseService = typeof window === 'undefined' ? getServiceSupabase() : null
