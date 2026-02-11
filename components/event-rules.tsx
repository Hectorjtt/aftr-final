"use client"

import { eventConfig } from "@/lib/event-config"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function EventRules() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">Reglas Importantes</h2>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="rules" className="rounded-lg border border-white/10 bg-white/5 px-6 backdrop-blur-sm">
              <AccordionTrigger className="text-white hover:text-orange-500 hover:no-underline">
                Ver todas las reglas del evento
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 pt-4">
                  {eventConfig.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3 text-white/80">
                      <span className="text-orange-500">•</span>
                      <span className="text-pretty">{rule}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
}
