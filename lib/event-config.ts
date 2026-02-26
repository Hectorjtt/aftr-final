// Event configuration - Easy to update for future events
export const eventConfig = {
  brand: "aftr.",
  theme: {
    name: "halloween",
    emoji: "🎃",
    colors: {
      primary: "#ff6b35", // Orange
      secondary: "#a855f7", // Purple
      accent: "#ff9500",
    },
    icons: ["🦇", "🎃", "🧙", "⚰️"],
  },
  event: {
    name: "A NORMAL HALLOWEEN BRUNCH PT.2",
    shortName: "The Normal",
    date: "Sábado, 25 de Octubre",
    time: "4:00 PM - 9:00 PM",
    location: {
      venue: "Almara cla y pon",
      address: "Monterrey, Nuevo León, México",
      coordinates: {
        lat: 20.6764,
        lng: -103.3472,
      },
    },
  },
  lineup: [
    {
      area: "Pista",
      sponsor: "Maestro Dobel",
    },
    {
      area: "1er Anillo",
      sponsor: "Jose Cuervo Traditional Plata",
    },
    {
      area: "2do Anillo - Zona DJ",
      sponsor: "Bacardi",
    },
  ],
  cover: {
    phases: [
      { name: "Fase 1", price: 500 },
      { name: "Día del evento", price: 550 },
    ],
    online: 500,
    /** Comisión por operación (transferencia o tarjeta). Se suma al total. */
    commission: 30,
  },
  includes: [
    "Botella de Cortesía por Mesa",
    "1 Pizza por Mesa",
    "Mixers GRATIS ILIMITADOS",
    "Happenings & Snacks",
    "30% Off en Winddex & Resistoles",
    "Photo Opportunity",
  ],
  rules: [
    "La propina no está incluida. Cada mesa tendrá su mesero asignado durante todo el brunch. Se recomienda dejar $600-800 pesos por mesa, ya que el mesero será la persona que les estará atendiendo durante el evento.",
    "Como máximo es permitido traer 5 litros de alcohol por mesa",
    "Botellas que ingresen al antro, no se podrán retirar terminando el evento por reglamento del estado, aunque estén cerradas.",
    "Por seguridad de todos, no se permite el ingreso con botellas abiertas. Queremos que disfruten sin preocupaciones, así que les pedimos respetar esta medida.",
    "Por políticas de The Normal, no está permitido ingresar con Hpnotiq, Jägermeister, Vodka Tamarindo, cerveza, seltzers, fourloko, buzballs, bebidas energéticas o cualquier tipo de derivados de shots.",
    "Está permitido únicamente botellas destiladas cerradas.",
  ],
  tables: [
    { id: "mesa-1", name: "Mesa 1 - Pista", zone: "Pista" },
    { id: "mesa-2", name: "Mesa 2 - Pista", zone: "Pista" },
    { id: "mesa-3", name: "Mesa 3 - 1er Anillo", zone: "1er Anillo" },
    { id: "mesa-4", name: "Mesa 4 - 1er Anillo", zone: "1er Anillo" },
    { id: "mesa-5", name: "Mesa 5 - 2do Anillo", zone: "2do Anillo" },
    { id: "mesa-6", name: "Mesa 6 - 2do Anillo", zone: "2do Anillo" },
  ],
  payment: {
    bank: "STP (Sistema de Transferencias y Pagos)",
    account: "123456789",
    clabe: "646021111865217072",
    holder: "Christian Ariel Rosales Rodríguez",
  },
  social: {
    instagram: "https://www.instagram.com/aftr.mx/",
    twitter: "https://twitter.com/aftr_events",
  },
}
