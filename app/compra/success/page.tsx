"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

function CompraSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!sessionId) {
      setStatus("error")
      setMessage("Falta el identificador de la sesión.")
      return
    }

    let cancelled = false

    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const refresh = session?.refresh_token

      const res = await fetch(
        `/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`,
        {
          credentials: "include",
          ...(token && {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(refresh && { "X-Refresh-Token": refresh }),
            },
          }),
        }
      )

      if (cancelled) return

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus("error")
        setMessage(data?.error || "No se pudo verificar el pago.")
        return
      }

      setStatus("success")
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="pt-12 pb-12">
                {status === "loading" && (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                    <p className="text-white/80">Verificando tu pago...</p>
                  </div>
                )}

                {status === "success" && (
                  <div className="text-center">
                    <CheckCircleIcon className="mx-auto mb-6 h-20 w-20 text-green-500" />
                    <h2 className="mb-4 text-3xl font-bold text-white">¡Pago recibido!</h2>
                    <p className="mb-8 text-pretty text-white/80">
                      Tu pago con tarjeta se ha procesado correctamente. Tus tickets ya están listos en <strong>Mis Tickets</strong>.
                    </p>
                    <Button
                      onClick={() => (window.location.href = "/tickets")}
                      className="bg-orange-500 text-black hover:bg-orange-400"
                    >
                      Ver mis tickets
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = "/")}
                      className="ml-3 border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      Inicio
                    </Button>
                  </div>
                )}

                {status === "error" && (
                  <div className="text-center">
                    <h2 className="mb-4 text-xl font-bold text-red-400">Error</h2>
                    <p className="mb-6 text-white/80">{message}</p>
                    <Button
                      onClick={() => (window.location.href = "/compra")}
                      className="bg-orange-500 text-black hover:bg-orange-400"
                    >
                      Volver a compra
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function CompraSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Header />
          <main className="py-16">
            <div className="container mx-auto px-4 flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <CompraSuccessContent />
    </Suspense>
  )
}
