"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        if (error) {
          console.error("Error al obtener sesión:", error)
        }

        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        if (!isMounted) {
          return
        }

        console.error("Error en useSupabaseUser:", error)
        setUser(null)
        setLoading(false)
      }
    }

    loadInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return
      }

      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}



