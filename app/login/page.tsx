"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <Suspense fallback={<div className="text-white">Cargando...</div>}>
              <LoginForm />
            </Suspense>
            <div className="mt-4 text-center">
              <p className="text-white/60">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-orange-500 hover:text-orange-400">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

