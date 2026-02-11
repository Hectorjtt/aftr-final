"use client"

import { useEffect, useState } from "react"
import { getPendingPurchaseRequests, approvePurchaseRequest, rejectPurchaseRequest } from "@/lib/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  user: {
    id: string
    email: string
  } | null
}

export function PendingPayments() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)

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
    if (processing !== null) {
      console.log('[handleApprove] Ya hay una operación en proceso, ID actual:', processing)
      return
    }

    try {
      console.log('[handleApprove] Iniciando aprobación, estableciendo processing a:', id)
      setProcessing(id)
      console.log('[handleApprove] Llamando a approvePurchaseRequest con ID:', id)
      const result = await approvePurchaseRequest(id)
      console.log('[handleApprove] Resultado recibido de approvePurchaseRequest:', JSON.stringify(result, null, 2))
      
      if (result && result.success) {
        console.log('[handleApprove] Aprobación exitosa, recargando lista...')
        await loadRequests()
        console.log('[handleApprove] Lista recargada')
      } else {
        const errorMsg = result?.error || 'Error desconocido'
        console.error('[handleApprove] Error en el resultado:', errorMsg)
        alert(`Error al aprobar: ${errorMsg}`)
      }
    } catch (error: any) {
      console.error('[handleApprove] Excepción capturada:', error)
      console.error('[handleApprove] Stack trace:', error.stack)
      alert(`Error al aprobar: ${error.message || 'Error desconocido'}`)
    } finally {
      console.log('[handleApprove] Limpiando estado processing')
      setProcessing(null)
    }
  }

  const handleReject = async (id: number) => {
    if (processing !== null) {
      console.log('Ya hay una operación en proceso, ID actual:', processing)
      return
    }

    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) {
      console.log('Usuario canceló el rechazo')
      return
    }
    
    try {
      console.log('Iniciando rechazo, estableciendo processing a:', id)
      setProcessing(id)
      console.log('Llamando a rejectPurchaseRequest con ID:', id)
      const result = await rejectPurchaseRequest(id)
      console.log('Resultado recibido de rejectPurchaseRequest:', JSON.stringify(result, null, 2))
      
      if (result && result.success) {
        console.log('Rechazo exitoso, recargando lista...')
        await loadRequests()
        console.log('Lista recargada')
      } else {
        const errorMsg = result?.error || 'Error desconocido'
        console.error('Error en el resultado:', errorMsg)
        alert(`Error al rechazar: ${errorMsg}`)
      }
    } catch (error: any) {
      console.error('Excepción capturada en handleReject:', error)
      console.error('Stack trace:', error.stack)
      alert(`Error al rechazar: ${error.message || 'Error desconocido'}`)
    } finally {
      console.log('Limpiando estado processing')
      setProcessing(null)
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
                  Mesa {request.table_id} - {request.quantity} {request.quantity === 1 ? 'cover' : 'covers'}
                </CardTitle>
                <CardDescription className="text-white/60">
                  {request.user?.email || `Usuario ID: ${request.user_id?.substring(0, 8)}...` || 'Usuario desconocido'}
                </CardDescription>
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
            
            {request.proof_of_payment_url && (
              <div>
                <p className="mb-2 text-sm font-medium text-white">Comprobante de pago:</p>
                <a
                  href={request.proof_of_payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-400 underline"
                >
                  Ver comprobante
                </a>
              </div>
            )}

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
                onClick={() => handleReject(request.id)}
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
    </div>
  )
}

