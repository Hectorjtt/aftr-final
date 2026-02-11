import { Header } from "@/components/header"
import { EventHero } from "@/components/event-hero"
import { EventMap } from "@/components/event-map"
import { EventDetails } from "@/components/event-details"
import { CoverPricing } from "@/components/cover-pricing"
import { EventIncludes } from "@/components/event-includes"
import { EventRules } from "@/components/event-rules"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <EventHero />
        <EventMap />
        <EventDetails />
        <CoverPricing />
        <EventIncludes />
        <EventRules />
      </main>
      <Footer />
    </div>
  )
}
