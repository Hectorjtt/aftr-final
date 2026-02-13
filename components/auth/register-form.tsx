"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    if (!phone.trim()) {
      setError("El teléfono es obligatorio")
      setLoading(false)
      return
    }

    try {
      // Registrar usuario
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      // Guardar en user_roles: el trigger de Supabase puede crear la fila; si no, hacemos INSERT.
      if (data.user) {
        const row = {
          user_id: data.user.id,
          role: 'client' as const,
          email,
          phone: phone.trim() || null,
        }
        const { error: insertError } = await supabase.from('user_roles').insert(row)

        if (insertError) {
          // Si falla por fila duplicada (trigger ya creó la fila), solo actualizamos email y teléfono
          if (insertError.code === '23505') {
            const { error: updateError } = await supabase
              .from('user_roles')
              .update({ email, phone: row.phone })
              .eq('user_id', data.user!.id)
            if (updateError) {
              console.error('Error al actualizar user_roles:', updateError)
              setError('Cuenta creada, pero no se guardó el perfil. Contacta al administrador.')
              setLoading(false)
              return
            }
          } else {
            console.error('Error al guardar en user_roles:', insertError)
            setError(
              'Cuenta creada, pero no se pudo guardar tu perfil. Ejecuta en Supabase el SQL de la carpeta supabase/migrations. Error: ' +
                insertError.message
            )
            setLoading(false)
            return
          }
        }
      }

      setSuccess(true)
      // Redirigir después de 1 segundo
      setTimeout(() => {
        window.location.href = "/"
      }, 1000)
    } catch (error: any) {
      setError(error.message || "Error al registrar usuario")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-green-400 mb-4">
              ¡Registro exitoso! Redirigiendo...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Crear Cuenta</CardTitle>
        <CardDescription className="text-white/60">
          Regístrate para comprar covers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
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
            <Label htmlFor="phone" className="text-white">
              Teléfono
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
              placeholder="Ej: 8116579043"
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
              minLength={6}
              className="border-white/20 bg-white/5 text-white"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-white">
              Confirmar Contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border-white/20 bg-white/5 text-white"
              placeholder="Repite tu contraseña"
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
            {loading ? "Registrando..." : "Registrarse"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

