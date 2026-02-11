"use client"

import { eventConfig } from "@/lib/event-config"

export function EventMap() {
  const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3595.945227961218!2d-100.33946532341781!3d25.67311031225789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8662bf1e46075f6d%3A0x40d1a4bd4d2f0fb8!2sThe%20Normal!5e0!3m2!1ses-419!2smx!4v1762983425371!5m2!1ses-419!2smx"

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="overflow-hidden rounded-lg border border-white/10">
          <iframe
            src={mapUrl}
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </div>
        <p className="mt-4 text-center text-sm text-white/60">
        </p>
      </div>
    </section>
  )
}
