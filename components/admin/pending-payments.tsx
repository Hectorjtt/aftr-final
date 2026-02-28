"use client"

import { useEffect, useState } from "react"
import { getPendingPurchaseRequests, approvePurchaseRequest, rejectPurchaseRequest } from "@/lib/admin"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface PurchaseRequest {
  id: number
  user_id: string
  table_id: string
  quantity: number
  names: string[]
  total_price: number
  proof_of_payment_url: string | null
  status: string
  created_at: string
  reference?: string | null
  payment_method?: string | null
  user: {
    id: string
    email: string | null
    phone: string | null
  } | null
}

export function PendingPayments() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null)
  const [confirmPending, setConfirmPending] = useState<{ action: 'approve' | 'reject'; id: number } | null>(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await getPendingPurchaseRequests()
      if (error) {
        console.error('Error al cargar comprobantes:', error)
        console.error('Detalles completos del error:', JSON.stringify(error, null, 2))
        alert(`Error al cargar comprobantes: ${error.message || 'Error desconocido'}`)
        setRequests([])
      } else if (data) {
        console.log('Comprobantes cargados exitosamente:', data.length)
        setRequests(data)
      } else {
        console.log('No se encontraron comprobantes')
        setRequests([])
      }
    } catch (err: any) {
      console.error('Excepción al cargar comprobantes:', err)
      alert(`Error inesperado: ${err.message || 'Error desconocido'}`)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (processing !== null) return
    setConfirmPending({ action: 'approve', id })
  }

  const handleRejectClick = (id: number) => {
    if (processing !== null) return
    setConfirmPending({ action: 'reject', id })
  }

  const runConfirmAction = async () => {
    if (!confirmPending) return
    const { action, id } = confirmPending
    setConfirmPending(null)

    if (action === 'approve') {
      try {
        setProcessing(id)
        const result = await approvePurchaseRequest(id)
        if (result?.success) {
          await loadRequests()
          // Notificar por correo al usuario (sesión está en localStorage, enviamos token en header)
          supabase.auth.getSession().then(({ data: { session } }) => {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
            fetch('/api/notify-ticket-approved', {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({ purchaseRequestId: id }),
            }).catch(() => {})
          })
        } else {
          alert(`Error al aprobar: ${result?.error || 'Error desconocido'}`)
        }
      } catch (error: any) {
        alert(`Error al aprobar: ${error.message || 'Error desconocido'}`)
      } finally {
        setProcessing(null)
      }
    } else {
      try {
        setProcessing(id)
        const result = await rejectPurchaseRequest(id)
        if (result?.success) {
          await loadRequests()
        } else {
          alert(`Error al rechazar: ${result?.error || 'Error desconocido'}`)
        }
      } catch (error: any) {
        alert(`Error al rechazar: ${error.message || 'Error desconocido'}`)
      } finally {
        setProcessing(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center text-white/60">Cargando comprobantes...</div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="pt-6">
          <p className="text-center text-white/60">
            No hay comprobantes de pago pendientes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="border-white/10 bg-white/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white">
                  {request.table_id === 'sin-mesa'
                    ? `Cover sin mesa - ${request.quantity} ${request.quantity === 1 ? 'cover' : 'covers'}`
                    : request.table_id === 'mesa-1'
                    ? `Mesa RPS - ${request.quantity} ${request.quantity === 1 ? 'cover' : 'covers'}`
                    : `Mesa ${request.table_id.replace(/^mesa-/, '')} - ${request.quantity} ${request.quantity === 1 ? 'cover' : 'covers'}`}
                  {request.payment_method === 'card' && (
                    <span className="ml-2 rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Tarjeta</span>
                  )}
                </CardTitle>
                <CardDescription className="text-white/60">
                  {request.user?.email || `Usuario ID: ${request.user_id?.substring(0, 8)}...` || 'Usuario desconocido'}
                </CardDescription>
                {request.reference && (
                  <CardDescription className="text-white/60">
                    Referencia: {request.reference}
                  </CardDescription>
                )}
                <CardDescription className="text-white/60">
                  {new Date(request.created_at).toLocaleString('es-MX')}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-white">
                  ${request.total_price.toLocaleString('es-MX')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-white">Nombres:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-white/80">
                {request.names?.map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="mb-2 text-sm font-medium text-white">Comprobante de pago:</p>
              <div className="space-y-1">
                {request.proof_of_payment_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewProofUrl(request.proof_of_payment_url!)}
                    className="block text-orange-500 hover:text-orange-400 underline text-left"
                  >
                    Ver comprobante
                  </button>
                )}
                {request.user?.phone && (() => {
                  const digits = request.user.phone.replace(/\D/g, '')
                  const whatsappNumber = digits.length === 10 ? `52${digits}` : digits.length === 12 && digits.startsWith('52') ? digits : `52${digits}`
                  return (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-green-500 hover:text-green-400 underline text-left"
                    >
                      Contactar WhatsApp
                    </a>
                  )
                })()}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(request.id)}
                disabled={processing !== null}
                className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {processing === request.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleRejectClick(request.id)}
                disabled={processing !== null}
                variant="destructive"
                className="flex-1 disabled:opacity-50"
              >
                {processing === request.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!confirmPending} onOpenChange={(open) => !open && setConfirmPending(null)}>
        <DialogContent className="border-white/10 bg-black/95 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {confirmPending?.action === 'approve'
                ? '¿Estás seguro de aprobar este comprobante?'
                : '¿Estás seguro de rechazar este comprobante?'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 justify-center pt-4">
            <Button
              type="button"
              onClick={runConfirmAction}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Confirmar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmPending(null)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewProofUrl} onOpenChange={(open) => !open && setPreviewProofUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-white/10 bg-black/95">
          <DialogHeader>
            <DialogTitle className="text-white">Vista previa del comprobante</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[50vh] bg-black/50 rounded-lg overflow-auto p-4">
            {previewProofUrl && (
              previewProofUrl.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={previewProofUrl}
                  title="Comprobante de pago"
                  className="w-full h-[70vh] rounded border-0"
                />
              ) : (
                <img
                  src={previewProofUrl}
                  alt="Comprobante de pago"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

