"use client"

import { eventConfig } from "@/lib/event-config"
import { CheckIcon } from "@heroicons/react/24/solid"
import { motion } from "framer-motion"

export function EventIncludes() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">— INCLUDE —</h2>

          <div className="space-y-4">
            {eventConfig.includes.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-500">
                  <CheckIcon className="h-4 w-4 text-black" />
                </div>
                <p className="text-pretty text-white">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
