"use client"

import { useEffect, useState } from "react"
import { getUserTickets } from "@/lib/tickets"
import { TicketCard } from "./ticket-card"
import { Card, CardContent } from "@/components/ui/card"

interface Ticket {
  id: number
  qr_code: string
  cover_name: string
  table_id: string
  status: 'pending' | 'approved' | 'used' | 'cancelled'
  scanned_at: string | null
  created_at: string
  purchase_requests: {
    id: number
    table_id: string
    quantity: number
    total_price: number
    status: string
    created_at: string
  } | null
}

export function TicketsList({ userId }: { userId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTickets()
  }, [userId])

  const loadTickets = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getUserTickets(userId)
    
    if (err) {
      setError('Error al cargar tickets')
      setLoading(false)
      return
    }

    setTickets(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center text-white/60">Cargando tickets...</div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-500/50 bg-red-500/10">
        <CardContent className="pt-6">
          <p className="text-center text-red-400">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (tickets.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="pt-6">
          <p className="text-center text-white/60">
            No tienes tickets aún. Compra un cover para obtener tus tickets.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Agrupar tickets por purchase_request
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const prId = ticket.purchase_requests?.id || 'unknown'
    if (!acc[prId]) {
      acc[prId] = []
    }
    acc[prId].push(ticket)
    return acc
  }, {} as Record<string | number, Ticket[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedTickets).map(([prId, groupTickets]) => (
        <div key={prId} className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Mesa {groupTickets[0].table_id}
                </h3>
                <p className="text-sm text-white/60">
                  {groupTickets.length} {groupTickets.length === 1 ? 'ticket' : 'tickets'}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  groupTickets[0].status === 'approved' 
                    ? 'bg-green-500/20 text-green-400' 
                    : groupTickets[0].status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : groupTickets[0].status === 'used'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {groupTickets[0].status === 'approved' ? 'Aprobado' :
                   groupTickets[0].status === 'pending' ? 'Pendiente' :
                   groupTickets[0].status === 'used' ? 'Usado' : 'Cancelado'}
                </span>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}



