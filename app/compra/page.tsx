"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PurchaseForm } from "@/components/purchase-form"

export default function CompraPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-8 text-center text-4xl font-bold text-white">Comprar Cover</h1>
            <PurchaseForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
