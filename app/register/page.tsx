"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <RegisterForm />
            <div className="mt-4 text-center">
              <p className="text-white/60">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-orange-500 hover:text-orange-400">
                  Inicia sesión aquí
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



