"use client"

import { useEffect, useState } from "react"
import { getAllTickets, movePurchaseOrderToTable, moveTicketsToTable } from "@/lib/admin"
import { supabase } from "@/lib/supabase"
import { eventConfig } from "@/lib/event-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, XCircle, Users, Loader2, Move } from "lucide-react"
import { toast } from "sonner"

interface Ticket {
  id: number
  qr_code: string
  cover_name: string
  table_id: string
  status: 'pending' | 'approved' | 'used' | 'cancelled'
  scanned_at: string | null
  created_at: string
  scanned_by: string | null
  user_id?: string
  purchase_request_id?: number | null
}

interface GroupedOrder {
  purchaseRequestId: number | null
  tickets: Ticket[]
  orderCreatedAt: string
}

export function TableDashboard() {
  const [orders, setOrders] = useState<GroupedOrder[]>([])
  const [userPhones, setUserPhones] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movingOrderKey, setMovingOrderKey] = useState<string | null>(null)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<GroupedOrder | null>(null)
  const [selectedNewTable, setSelectedNewTable] = useState<string>("")

  useEffect(() => {
    loadData()
    // Refrescar cada 30 segundos para ver datos actualizados
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: err } = await getAllTickets()
      
      if (err) {
        console.error('Error al cargar tickets:', err)
        setError('Error al cargar los datos')
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // Filtrar solo tickets aprobados (para ver covers activos)
      const approvedTickets = data.filter((ticket: Ticket) => ticket.status === 'approved' || ticket.status === 'used') as Ticket[]

      // Obtener teléfonos de user_roles para cada user_id
      const userIds = [...new Set(approvedTickets.map((t) => t.user_id).filter(Boolean))] as string[]
      const phonesMap: Record<string, string | null> = {}
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, phone')
          .in('user_id', userIds)
        rolesData?.forEach((row: { user_id: string; phone: string | null }) => {
          phonesMap[row.user_id] = row.phone ?? null
        })
      }
      setUserPhones(phonesMap)

      // Agrupar por orden de compra (purchase_request_id)
      const byOrder = approvedTickets.reduce<Record<string, { tickets: Ticket[] }>>((acc, ticket) => {
        const key = ticket.purchase_request_id != null ? String(ticket.purchase_request_id) : 'sin-orden'
        if (!acc[key]) acc[key] = { tickets: [] }
        acc[key].tickets.push(ticket)
        return acc
      }, {})

      const ordersArray: GroupedOrder[] = Object.entries(byOrder).map(([key, { tickets }]) => {
        const orderCreatedAt = tickets.reduce<string>((min, t: Ticket) => (t.created_at < min ? t.created_at : min), tickets[0].created_at)
        return {
          purchaseRequestId: key === 'sin-orden' ? null : parseInt(key, 10),
          tickets,
          orderCreatedAt,
        }
      })

      // Ordenar por fecha de orden (más reciente primero)
      ordersArray.sort((a, b) => new Date(b.orderCreatedAt).getTime() - new Date(a.orderCreatedAt).getTime())
      setOrders(ordersArray)
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'used':
        return <CheckCircle className="h-4 w-4 text-blue-400" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    // Solo mostrar etiqueta si está usado, los aprobados no necesitan etiqueta
    if (status === 'used') {
      return <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10">Usado</Badge>
    }
    // No mostrar etiqueta para aprobados, pendientes o cancelados
    return null
  }

  const handleMoveOrder = (order: GroupedOrder) => {
    setSelectedOrder(order)
    setSelectedNewTable("")
    setMoveDialogOpen(true)
  }

  const confirmMoveOrder = async () => {
    if (!selectedOrder || !selectedNewTable) {
      toast.error("Por favor selecciona una mesa destino")
      return
    }
    const currentTable = selectedOrder.tickets[0]?.table_id
    if (currentTable === selectedNewTable) {
      toast.error("La orden ya está en esa mesa")
      setMoveDialogOpen(false)
      return
    }

    const orderKey = selectedOrder.purchaseRequestId != null ? String(selectedOrder.purchaseRequestId) : selectedOrder.tickets.map((t) => t.id).join('-')
    setMovingOrderKey(orderKey)
    try {
      const result = selectedOrder.purchaseRequestId != null
        ? await movePurchaseOrderToTable(selectedOrder.purchaseRequestId, selectedNewTable)
        : await moveTicketsToTable(selectedOrder.tickets.map((t) => t.id), selectedNewTable)
      if (result.success) {
        const count = selectedOrder.tickets.length
        toast.success(`${count} cover${count !== 1 ? 's' : ''} movido${count !== 1 ? 's' : ''} a Mesa ${selectedNewTable.replace('mesa-', '')}`)
        setMoveDialogOpen(false)
        setSelectedOrder(null)
        setSelectedNewTable("")
        await loadData()
      } else {
        toast.error(result.error || "Error al mover la orden")
      }
    } catch (err: any) {
      console.error("Error al mover orden:", err)
      toast.error("Error al mover la orden")
    } finally {
      setMovingOrderKey(null)
    }
  }

  // Generar lista completa de todas las mesas del mapa
  const getAllTablesFromMap = () => {
    // Mesas del Segundo Anillo (10-16, 60-65)
    const segundoAnillo = [
      ...Array.from({ length: 7 }, (_, i) => i + 10), // 10-16
      ...Array.from({ length: 6 }, (_, i) => i + 60), // 60-65
    ].map(id => ({
      id: `mesa-${id}`,
      name: `Mesa ${id} - Segundo Anillo`,
      zone: "Segundo Anillo"
    }))

    // Mesas del Primer Anillo (20-25, 50-55)
    const primerAnillo = [
      ...Array.from({ length: 6 }, (_, i) => i + 20), // 20-25
      ...Array.from({ length: 6 }, (_, i) => i + 50), // 50-55
    ].map(id => ({
      id: `mesa-${id}`,
      name: `Mesa ${id} - Primer Anillo`,
      zone: "Primer Anillo"
    }))

    // Mesas en Pista (31-36, 41-46)
    const mesasPista = [
      ...Array.from({ length: 6 }, (_, i) => i + 31), // 31-36
      ...Array.from({ length: 6 }, (_, i) => i + 41), // 41-46
    ].map(id => ({
      id: `mesa-${id}`,
      name: `Mesa ${id} - Pista`,
      zone: "Pista"
    }))

    // Mesas adicionales del mapa (2-6)
    const mesasAdicionales = [2, 3, 4, 5, 6].map(id => ({
      id: `mesa-${id}`,
      name: `Mesa ${id}`,
      zone: "Pista"
    }))

    // Combinar todas las mesas y ordenar por número
    const allTables = [
      ...segundoAnillo,
      ...primerAnillo,
      ...mesasPista,
      ...mesasAdicionales,
    ].sort((a, b) => {
      const numA = parseInt(a.id.replace('mesa-', '')) || 0
      const numB = parseInt(b.id.replace('mesa-', '')) || 0
      return numA - numB
    })

    return allTables
  }

  // Obtener lista de mesas disponibles (excluyendo la mesa actual de la orden)
  const getAvailableTables = () => {
    const allTables = getAllTablesFromMap()
    const currentTable = selectedOrder?.tickets[0]?.table_id
    return allTables.filter((table) => table.id !== currentTable)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-white/60">Cargando datos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-500/50 bg-red-500/10">
        <CardContent className="pt-6">
          <p className="text-center text-red-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 w-full rounded-lg bg-red-500/20 px-4 py-2 text-red-400 hover:bg-red-500/30"
          >
            Intentar de nuevo
          </button>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-white/40" />
            <p className="text-white/60">
              No hay covers aprobados todavía.
            </p>
            <p className="mt-2 text-sm text-white/40">
              Los covers aparecerán aquí una vez que sean aprobados.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tableLabel = (tableId: string) => {
    if (tableId === 'sin-mesa') return 'Sin mesa'
    if (tableId === 'mesa-1') return 'RPS'
    return `Mesa ${tableId.replace('mesa-', '')}`
  }

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resumen General
          </CardTitle>
          <CardDescription className="text-white/60">
            Órdenes de compra aprobadas (transferencia o tarjeta), ordenadas por fecha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-white/20 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-white">{orders.length}</div>
              <div className="text-sm text-white/60">Órdenes</div>
            </div>
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {orders.reduce((sum, o) => sum + o.tickets.filter((t) => t.status === 'used').length, 0)}
              </div>
              <div className="text-sm text-blue-300/80">Usados</div>
            </div>
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {orders.reduce((sum, o) => sum + o.tickets.length, 0)}
              </div>
              <div className="text-sm text-orange-300/80">Total Covers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de órdenes de compra */}
      <div className="space-y-4">
        {orders.map((order) => {
          const orderKey = order.purchaseRequestId ?? `sin-orden-${order.tickets.map((t) => t.id).join('-')}`
          const currentTable = order.tickets[0]?.table_id ?? 'sin-mesa'
          const usedCount = order.tickets.filter((t) => t.status === 'used').length
          const isMoving = movingOrderKey === orderKey
          return (
            <Card key={orderKey} className="border-white/10 bg-white/5">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-white text-base">
                      Orden · {new Date(order.orderCreatedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      {order.tickets.length} {order.tickets.length === 1 ? 'cover' : 'covers'} · {tableLabel(currentTable)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {usedCount > 0 && (
                      <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10">
                        {usedCount} usado{usedCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Dialog
                      open={moveDialogOpen && selectedOrder === order}
                      onOpenChange={(open) => {
                        if (!open) {
                          setMoveDialogOpen(false)
                          setSelectedOrder(null)
                          setSelectedNewTable("")
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveOrder(order)}
                          className="border-orange-500/50 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20"
                        >
                          <Move className="h-3 w-3 mr-1" />
                          Mover orden
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-white/10 bg-black/95 backdrop-blur-sm">
                        <DialogHeader>
                          <DialogTitle className="text-white">Mover orden completa</DialogTitle>
                          <DialogDescription className="text-white/60">
                            Se moverán los {order.tickets.length} covers de esta orden a la mesa que elijas.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <p className="text-sm text-white/80 mb-2">Mesa actual:</p>
                            <p className="text-white font-medium">{tableLabel(currentTable)}</p>
                          </div>
                          <div>
                            <label className="text-sm text-white/80 mb-2 block">Mesa destino:</label>
                            <Select value={selectedNewTable} onValueChange={setSelectedNewTable}>
                              <SelectTrigger className="border-white/20 bg-white/5 text-white">
                                <SelectValue placeholder="Selecciona una mesa" />
                              </SelectTrigger>
                              <SelectContent className="border-white/10 bg-black/95">
                                {getAvailableTables().map((t) => (
                                  <SelectItem key={t.id} value={t.id} className="text-white focus:bg-white/10">
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setMoveDialogOpen(false)
                                setSelectedOrder(null)
                                setSelectedNewTable("")
                              }}
                              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={confirmMoveOrder}
                              disabled={!selectedNewTable || isMoving}
                              className="bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-50"
                            >
                              {isMoving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Moviendo...
                                </>
                              ) : (
                                "Mover todos"
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.tickets.map((cover) => (
                    <div
                      key={cover.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(cover.status)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{cover.cover_name}</p>
                          <p className="text-xs text-white/60">
                            Código: <span className="font-mono">{cover.qr_code}</span>
                          </p>
                          {cover.user_id && userPhones[cover.user_id] != null && (
                            <p className="text-xs text-white/50 mt-0.5">Tel: {userPhones[cover.user_id]}</p>
                          )}
                          {cover.scanned_at && (
                            <p className="text-xs text-blue-400 mt-1">
                              Escaneado: {new Date(cover.scanned_at).toLocaleString('es-MX')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>{getStatusBadge(cover.status)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


