import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

// Helper para obtener el usuario actual
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error("Error al obtener usuario:", error)
      return null
    }
    return user
  } catch (error) {
    console.error("Error en getCurrentUser:", error)
    return null
  }
}

// Helper para verificar si es admin
export async function isAdmin(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error) {
      console.error('Error al verificar rol:', error)
      return false
    }
    
    return data?.role === 'admin'
  } catch (error) {
    console.error('Error en isAdmin:', error)
    return false
  }
}

