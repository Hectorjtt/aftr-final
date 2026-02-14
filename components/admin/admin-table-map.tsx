"use client"

import { useState } from "react"
import { TableMap } from "@/components/table-map"
import { getTicketsByTable, updateTicketCoverName, moveCoverToTable } from "@/lib/admin"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Check, Move } from "lucide-react"
import { toast } from "sonner"

// Lista de todas las mesas del mapa (mismo orden que TableMap)
const ALL_TABLE_IDS = [
  ...Array.from({ length: 7 }, (_, i) => i + 10),
  ...Array.from({ length: 6 }, (_, i) => i + 20),
  ...Array.from({ length: 6 }, (_, i) => i + 31),
  ...Array.from({ length: 6 }, (_, i) => i + 41),
  ...Array.from({ length: 6 }, (_, i) => i + 50),
  ...Array.from({ length: 6 }, (_, i) => i + 60),
  ...[2, 3, 4, 5, 6],
].sort((a, b) => a - b)

interface Ticket {
  id: number
  cover_name: string
  table_id: string
  status: string
}

export function AdminTableMap() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [covers, setCovers] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [savingId, setSavingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showMoveSelect, setShowMoveSelect] = useState(false)
  const [moveTargetTable, setMoveTargetTable] = useState<string>("")
  const [movingIds, setMovingIds] = useState<Set<number>>(new Set())

  const handleTableClick = async (tableId: number) => {
    setSelectedTableId(tableId)
    setModalOpen(true)
    setLoading(true)
    setCovers([])
    setEditingId(null)
    setSelectedIds(new Set())
    setShowMoveSelect(false)
    setMoveTargetTable("")

    const { data, error } = await getTicketsByTable(tableId)

    setLoading(false)
    if (error || !data) {
      setCovers([])
      return
    }
    setCovers(data)
  }

  const handleStartEdit = (ticket: Ticket) => {
    setEditingId(ticket.id)
    setEditName(ticket.cover_name)
  }

  const handleSaveName = async (ticketId: number) => {
    const trimmed = editName.trim()
    if (!trimmed) return

    const ticket = covers.find((t) => t.id === ticketId)
    if (!ticket || ticket.cover_name === trimmed) {
      setEditingId(null)
      return
    }

    setSavingId(ticketId)
    const { success, error } = await updateTicketCoverName(ticketId, trimmed)
    setSavingId(null)
    setEditingId(null)

    if (success) {
      setCovers((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, cover_name: trimmed } : t))
      )
      toast.success("Nombre actualizado")
    } else {
      toast.error(error || "Error al actualizar")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, ticketId: number) => {
    if (e.key === "Enter") {
      handleSaveName(ticketId)
    }
    if (e.key === "Escape") {
      setEditingId(null)
      setEditName("")
    }
  }

  const toggleSelect = (ticketId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(ticketId)) {
        next.delete(ticketId)
      } else {
        next.add(ticketId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === covers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(covers.map((t) => t.id)))
    }
  }

  const handleMoveToTable = async () => {
    if (!moveTargetTable || selectedIds.size === 0) {
      toast.error("Selecciona una mesa destino")
      return
    }

    const mesaId = moveTargetTable.startsWith("mesa-") ? moveTargetTable : `mesa-${moveTargetTable}`
    setMovingIds(new Set(selectedIds))

    let ok = 0
    let fail = 0
    for (const ticketId of selectedIds) {
      const result = await moveCoverToTable(ticketId, mesaId)
      if (result.success) ok++
      else fail++
    }

    setMovingIds(new Set())
    setSelectedIds(new Set())
    setShowMoveSelect(false)
    setMoveTargetTable("")

    if (fail > 0) {
      toast.error(`${fail} cover(s) no se pudieron mover`)
    }
    if (ok > 0) {
      toast.success(`${ok} cover(s) movidos a Mesa ${mesaId.replace("mesa-", "")}`)
      // Recargar covers de la mesa actual
      if (selectedTableId) {
        const { data } = await getTicketsByTable(selectedTableId)
        setCovers(data ?? [])
      }
    }
  }

  const availableTables = ALL_TABLE_IDS.filter((id) => id !== selectedTableId)

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        Haz clic en una mesa para ver los covers aprobados/usados. Edita los nombres haciendo clic en cada cover.
      </p>
      <TableMap
        selectedTable={selectedTableId}
        onSelectTable={handleTableClick}
        compact
      />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-white/10 bg-black/95 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Mesa {selectedTableId ?? ""}
            </DialogTitle>
          </DialogHeader>
          {covers.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80 hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedIds.size === covers.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-white/30 bg-white/5 text-orange-500"
                />
                Seleccionar todos
              </label>
              {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-white/60">
                    {selectedIds.size} seleccionado(s)
                  </span>
                  {!showMoveSelect ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMoveSelect(true)}
                      disabled={movingIds.size > 0}
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Move className="mr-1 h-4 w-4" />
                      Mover a mesa
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select
                        value={moveTargetTable}
                        onValueChange={setMoveTargetTable}
                      >
                        <SelectTrigger className="w-[140px] border-white/20 bg-white/5 text-white">
                          <SelectValue placeholder="Mesa destino" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-black/95">
                          {availableTables.map((id) => (
                            <SelectItem
                              key={id}
                              value={`mesa-${id}`}
                              className="text-white focus:bg-white/10"
                            >
                              Mesa {id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleMoveToTable}
                        disabled={!moveTargetTable || movingIds.size > 0}
                        className="bg-orange-500 text-black hover:bg-orange-400"
                      >
                        {movingIds.size > 0 ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Mover"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowMoveSelect(false)
                          setMoveTargetTable("")
                        }}
                        className="text-white/70 hover:bg-white/10 hover:text-white"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : covers.length === 0 ? (
              <p className="py-6 text-center text-white/60">
                No hay covers aprobados en esta mesa.
              </p>
            ) : (
              <ul className="space-y-2">
                {covers.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(ticket.id)}
                      onChange={() => toggleSelect(ticket.id)}
                      disabled={movingIds.has(ticket.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 shrink-0 rounded border-white/30 bg-white/5 text-orange-500"
                    />
                    {editingId === ticket.id ? (
                      <>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, ticket.id)}
                          onBlur={() => handleSaveName(ticket.id)}
                          autoFocus
                          className="flex-1 border-white/20 bg-white/5 text-white"
                        />
                        {savingId === ticket.id ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-orange-500" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveName(ticket.id)}
                            className="rounded p-1 text-orange-500 hover:bg-white/10"
                            title="Guardar"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span
                          className="flex-1 cursor-pointer text-white hover:text-orange-400"
                          onClick={() => handleStartEdit(ticket)}
                          title="Clic para editar"
                        >
                          {ticket.cover_name}
                        </span>
                        {ticket.status === "used" && (
                          <Badge className="shrink-0 bg-green-600/80 text-white">
                            Usado
                          </Badge>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
