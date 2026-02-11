"use client"

import { eventConfig } from "@/lib/event-config"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CoverPricing() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">— COVER BYOB —</h2>

          <div className="mb-12 grid gap-6 md:grid-cols-2">
            {eventConfig.cover.phases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg border border-white/10 bg-gradient-to-br from-orange-500/10 to-purple-500/10 p-8 text-center backdrop-blur-sm"
              >
                <h3 className="mb-2 text-lg font-semibold text-white">{phase.name}</h3>
                <p className="text-4xl font-bold text-orange-500">${phase.price}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/compra">
              <Button
                size="lg"
                className="bg-orange-500 px-8 py-6 text-lg font-semibold text-black transition-all hover:scale-105 hover:bg-orange-400"
              >
                Comprar Cover Ahora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
