"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TicketsList } from "@/components/tickets/tickets-list"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseUser } from "@/hooks/use-supabase-user"

export default function TicketsPage() {
  const { user, loading } = useSupabaseUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/tickets")
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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-8 text-center text-4xl font-bold text-white">Mis Tickets</h1>
            <TicketsList userId={user.id} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


