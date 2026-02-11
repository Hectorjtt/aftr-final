"use client"

import { eventConfig } from "@/lib/event-config"
import { motion } from "framer-motion"

export function EventHero() {
  return (
    <section className="relative overflow-hidden py-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-purple-500/20 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
            {eventConfig.event.name} {eventConfig.theme.emoji}
          </h1>
        </motion.div>
      </div>
    </section>
  )
}
