"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"

export function LoginForm() {
  const searchParams = useSearchParams()
  const [redirect, setRedirect] = useState("/")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Obtener redirect de los search params de forma segura
    const redirectParam = searchParams.get("redirect")
    if (redirectParam) {
      setRedirect(redirectParam)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Esperar un momento para asegurar que la sesión se establezca
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirigir inmediatamente después del login exitoso
      const targetUrl = redirect || "/"
      window.location.href = targetUrl
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión")
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Iniciar Sesión</CardTitle>
        <CardDescription className="text-white/60">
          Ingresa tus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-white/20 bg-white/5 text-white"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-white/20 bg-white/5 text-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-black hover:bg-orange-400"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

