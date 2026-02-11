"use client"

import { useEffect, useState } from "react"
import { getAllTickets, moveCoverToTable } from "@/lib/admin"
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
}

interface GroupedTable {
  tableId: string
  covers: Ticket[]
  approvedCount: number
  usedCount: number
  pendingCount: number
  totalCount: number
}

export function TableDashboard() {
  const [tables, setTables] = useState<GroupedTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movingCover, setMovingCover] = useState<number | null>(null)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [selectedCover, setSelectedCover] = useState<Ticket | null>(null)
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
        setTables([])
        setLoading(false)
        return
      }

      // Filtrar solo tickets aprobados (para ver covers activos)
      const approvedTickets = data.filter((ticket: Ticket) => ticket.status === 'approved' || ticket.status === 'used')
      
      // Agrupar por mesa
      const grouped = approvedTickets.reduce((acc: Record<string, GroupedTable>, ticket: Ticket) => {
        const tableId = ticket.table_id || 'sin-mesa'
        
        if (!acc[tableId]) {
          acc[tableId] = {
            tableId,
            covers: [],
            approvedCount: 0,
            usedCount: 0,
            pendingCount: 0,
            totalCount: 0,
          }
        }
        
        acc[tableId].covers.push(ticket)
        acc[tableId].totalCount++
        
        if (ticket.status === 'approved') {
          acc[tableId].approvedCount++
        } else if (ticket.status === 'used') {
          acc[tableId].usedCount++
        } else if (ticket.status === 'pending') {
          acc[tableId].pendingCount++
        }
        
        return acc
      }, {})

      // Convertir a array y ordenar por número de mesa
      const tablesArray = Object.values(grouped).sort((a, b) => {
        const numA = parseInt(a.tableId.replace(/\D/g, '')) || 0
        const numB = parseInt(b.tableId.replace(/\D/g, '')) || 0
        return numA - numB
      })

      setTables(tablesArray)
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

  const handleMoveCover = (cover: Ticket) => {
    setSelectedCover(cover)
    setSelectedNewTable("")
    setMoveDialogOpen(true)
  }

  const confirmMoveCover = async () => {
    if (!selectedCover || !selectedNewTable) {
      toast.error("Por favor selecciona una mesa destino")
      return
    }

    if (selectedCover.table_id === selectedNewTable) {
      toast.error("El cover ya está en esa mesa")
      setMoveDialogOpen(false)
      return
    }

    setMovingCover(selectedCover.id)
    
    try {
      const result = await moveCoverToTable(selectedCover.id, selectedNewTable)
      
      if (result.success) {
        toast.success(`Cover movido exitosamente a Mesa ${selectedNewTable.replace('mesa-', '')}`)
        setMoveDialogOpen(false)
        setSelectedCover(null)
        setSelectedNewTable("")
        // Recargar los datos
        await loadData()
      } else {
        toast.error(result.error || "Error al mover el cover")
      }
    } catch (error: any) {
      console.error("Error al mover cover:", error)
      toast.error("Error al mover el cover")
    } finally {
      setMovingCover(null)
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

  // Obtener lista de mesas disponibles (excluyendo la mesa actual del cover)
  const getAvailableTables = () => {
    const allTables = getAllTablesFromMap()
    return allTables.filter(
      table => !selectedCover || table.id !== selectedCover.table_id
    )
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

  if (tables.length === 0) {
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
            Total de mesas con covers: {tables.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {tables.reduce((sum, table) => sum + table.usedCount, 0)}
              </div>
              <div className="text-sm text-blue-300/80">Usados</div>
            </div>
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {tables.reduce((sum, table) => sum + table.totalCount, 0)}
              </div>
              <div className="text-sm text-orange-300/80">Total Covers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de mesas */}
      <div className="space-y-4">
        {tables.map((table) => (
          <Card key={table.tableId} className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    Mesa {table.tableId.replace('mesa-', '')}
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {table.totalCount} {table.totalCount === 1 ? 'cover' : 'covers'}
                  </CardDescription>
                </div>
                {table.usedCount > 0 && (
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10">
                    {table.usedCount} usado{table.usedCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {table.covers.map((cover) => (
                  <div
                    key={cover.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(cover.status)}
                      <div className="flex-1">
                        <p className="font-medium text-white">{cover.cover_name}</p>
                        <p className="text-xs text-white/60">
                          Código: <span className="font-mono">{cover.qr_code}</span>
                        </p>
                        {cover.scanned_at && (
                          <p className="text-xs text-blue-400 mt-1">
                            Escaneado: {new Date(cover.scanned_at).toLocaleString('es-MX')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {getStatusBadge(cover.status)}
                      <Dialog 
                        open={moveDialogOpen && selectedCover?.id === cover.id} 
                        onOpenChange={(open) => {
                          if (!open) {
                            setMoveDialogOpen(false)
                            setSelectedCover(null)
                            setSelectedNewTable("")
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveCover(cover)}
                            className="border-orange-500/50 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20"
                          >
                            <Move className="h-3 w-3 mr-1" />
                            Mover
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-white/10 bg-black/95 backdrop-blur-sm">
                          <DialogHeader>
                            <DialogTitle className="text-white">Mover Cover</DialogTitle>
                            <DialogDescription className="text-white/60">
                              Mover <strong className="text-white">{cover.cover_name}</strong> a otra mesa
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <p className="text-sm text-white/80 mb-2">Mesa actual:</p>
                              <p className="text-white font-medium">Mesa {cover.table_id.replace('mesa-', '')}</p>
                            </div>
                            <div>
                              <label className="text-sm text-white/80 mb-2 block">
                                Selecciona la mesa destino:
                              </label>
                              <Select
                                value={selectedNewTable}
                                onValueChange={setSelectedNewTable}
                              >
                                <SelectTrigger className="border-white/20 bg-white/5 text-white">
                                  <SelectValue placeholder="Selecciona una mesa" />
                                </SelectTrigger>
                                <SelectContent className="border-white/10 bg-black/95">
                                  {getAvailableTables().map((table) => (
                                    <SelectItem
                                      key={table.id}
                                      value={table.id}
                                      className="text-white focus:bg-white/10"
                                    >
                                      {table.name}
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
                                  setSelectedCover(null)
                                  setSelectedNewTable("")
                                }}
                                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={confirmMoveCover}
                                disabled={!selectedNewTable || movingCover === cover.id}
                                className="bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-50"
                              >
                                {movingCover === cover.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Moviendo...
                                  </>
                                ) : (
                                  "Confirmar Movimiento"
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


