"use client"

import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, CheckCircle, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Ticket {
  id: number
  qr_code: string
  cover_name: string
  table_id: string
  status: 'pending' | 'approved' | 'used' | 'cancelled'
  scanned_at: string | null
  created_at: string
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const downloadQR = () => {
    const svg = document.getElementById(`qr-${ticket.id}`)
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `ticket-${ticket.qr_code}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const getStatusIcon = () => {
    switch (ticket.status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />
      case 'used':
        return <CheckCircle className="h-5 w-5 text-blue-400" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-400" />
    }
  }

  const getStatusText = () => {
    switch (ticket.status) {
      case 'approved':
        return 'Aprobado'
      case 'pending':
        return 'Pendiente'
      case 'used':
        return 'Usado'
      case 'cancelled':
        return 'Cancelado'
    }
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">{ticket.cover_name}</CardTitle>
          {getStatusIcon()}
        </div>
        <p className="text-xs text-white/60">Mesa {ticket.table_id}</p>
        <p className="text-xs text-white/60">Estado: {getStatusText()}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center rounded-lg bg-white p-4">
          {ticket.status === 'approved' ? (
            <QRCodeSVG
              id={`qr-${ticket.id}`}
              value={ticket.qr_code}
              size={200}
              level="H"
              includeMargin={true}
            />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center text-white/40">
              QR no disponible
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-center text-xs text-white/60">
            Código: <span className="font-mono text-white/80">{ticket.qr_code}</span>
          </p>
          {ticket.status === 'approved' && (
            <Button
              onClick={downloadQR}
              variant="outline"
              size="sm"
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar QR
            </Button>
          )}
        </div>
        {ticket.scanned_at && (
          <p className="text-center text-xs text-white/60">
            Escaneado: {new Date(ticket.scanned_at).toLocaleString('es-MX')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}



