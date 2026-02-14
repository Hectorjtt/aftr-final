"use client"

import { useState } from "react"
import { TableMap } from "@/components/table-map"
import { getTicketsByTable, updateTicketCoverName } from "@/lib/admin"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check } from "lucide-react"
import { toast } from "sonner"

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

  const handleTableClick = async (tableId: number) => {
    setSelectedTableId(tableId)
    setModalOpen(true)
    setLoading(true)
    setCovers([])
    setEditingId(null)

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        Haz clic en una mesa para ver los covers aprobados/usados. Edita los nombres haciendo clic en cada cover.
      </p>
      <TableMap
        selectedTable={selectedTableId}
        onSelectTable={handleTableClick}
      />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-white/10 bg-black/95 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Mesa {selectedTableId ?? ""}
            </DialogTitle>
          </DialogHeader>
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
                          <Badge className="shrink-0 bg-blue-600/80 text-white">
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
