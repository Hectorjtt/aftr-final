"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AdminPanel } from "@/components/admin/admin-panel"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAdmin } from "@/lib/supabase"
import { useSupabaseUser } from "@/hooks/use-supabase-user"

export default function AdminPage() {
  const { user, loading } = useSupabaseUser()
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const verifyAccess = async () => {
      if (!loading && !user) {
        router.push("/login?redirect=/admin")
        return
      }

      if (!user) {
        return
      }

      try {
        const admin = await isAdmin(user.id)
        if (!isMounted) return

        if (!admin) {
          router.push("/")
          return
        }

        setIsUserAdmin(true)
      } catch (error) {
        console.error("Error al verificar admin:", error)
        router.push("/")
      }
    }

    verifyAccess()

    return () => {
      isMounted = false
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center text-white">Cargando...</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center text-white">No tienes permisos para acceder a esta página.</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-8 text-center text-4xl font-bold text-white">Panel de Administración</h1>
            <AdminPanel userId={user.id} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


