"use client"

import { eventConfig } from "@/lib/event-config"
import { CalendarIcon, ClockIcon, MapPinIcon, MicrophoneIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

export function EventDetails() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <CalendarIcon className="mb-4 h-8 w-8 text-orange-500" />
            <h3 className="mb-2 text-sm font-medium text-white/60">Fecha</h3>
            <p className="text-lg font-semibold text-white">{eventConfig.event.date}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <ClockIcon className="mb-4 h-8 w-8 text-orange-500" />
            <h3 className="mb-2 text-sm font-medium text-white/60">Horario</h3>
            <p className="text-lg font-semibold text-white">{eventConfig.event.time}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <MapPinIcon className="mb-4 h-8 w-8 text-orange-500" />
            <h3 className="mb-2 text-sm font-medium text-white/60">Lugar</h3>
            <p className="text-lg font-semibold text-white">{eventConfig.event.shortName}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <MicrophoneIcon className="mb-4 h-8 w-8 text-orange-500" />
            <h3 className="mb-2 text-sm font-medium text-white/60">Lineup</h3>
            <p className="text-lg font-semibold text-white">{eventConfig.lineup.length} Zonas</p>
          </motion.div>
        </div>

        {/* Lineup Details */}
        <div className="mt-12">
          <h2 className="mb-6 text-center text-3xl font-bold text-white">Lineup</h2>
          <div className="space-y-4">
            {eventConfig.lineup.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                  <span className="text-orange-500">•</span>
                </div>
                <div>
                  <p className="font-semibold text-white">{item.area}</p>
                  <p className="text-sm text-white/60">{item.sponsor}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
