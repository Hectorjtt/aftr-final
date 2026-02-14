"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { eventConfig } from "@/lib/event-config"
import { supabase } from "@/lib/supabase"
import { useSupabaseUser } from "@/hooks/use-supabase-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableMap } from "@/components/table-map"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { Copy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type FormData = {
  table: string
  quantity: number
  names: string[]
  proofOfPayment: FileList
}

type PurchaseType = "reserva-mesa-5" | "con-mesa" | "sin-mesa"

const stepsWithTable = [
  { id: 1, title: "Seleccionar Mesa", description: "Elige la mesa para tu cover" },
  { id: 2, title: "Cantidad de Covers", description: "¿Cuántos covers necesitas?" },
  { id: 3, title: "Nombres", description: "Ingresa los nombres para cada cover" },
  { id: 4, title: "Términos y Condiciones", description: "Lee y acepta las políticas del evento" },
  { id: 5, title: "Pago", description: "Completa tu transferencia" },
]

const stepsSinMesa = [
  { id: 1, title: "Cantidad de Covers", description: "¿Cuántos covers necesitas?" },
  { id: 2, title: "Nombres", description: "Ingresa los nombres para cada cover" },
  { id: 3, title: "Términos y Condiciones", description: "Lee y acepta las políticas del evento" },
  { id: 4, title: "Pago", description: "Completa tu transferencia" },
]

const TERMS_CONTENT = [
  "La propina no está incluida. Cada mesa tendrá su mesero asignado durante todo el brunch. Se recomienda dejar $600-800 pesos por mesa, ya que el mesero será la persona que les estará atendiendo durante el evento.",
  "Como máximo es permitido traer 5 litros de alcohol por mesa.",
  "Botellas que ingresen al antro, no se podrán retirar terminando el evento por reglamento del estado, aunque estén cerradas.",
  "Por seguridad de todos, no se permite el ingreso con botellas abiertas. Queremos que disfruten sin preocupaciones, así que les pedimos respetar esta medida.",
  "Por políticas de The Normal, no está permitido ingresar con Hpnotiq, Jägermeister, Vodka Tamarindo, cerveza, seltzers, fourloko, buzballs, bebidas energéticas o cualquier tipo de derivados de shots.",
  "Está permitido únicamente botellas destiladas cerradas.",
]

export function PurchaseForm() {
  const [purchaseType, setPurchaseType] = useState<PurchaseType | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<FormData>>({
    quantity: 1,
    names: [""],
  })
  const [isComplete, setIsComplete] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [transferReference, setTransferReference] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [hasProofFile, setHasProofFile] = useState(false)
  const { user, loading } = useSupabaseUser()
  const router = useRouter()

  const generateReference = () => String(Math.floor(10000 + Math.random() * 90000))

  const steps = purchaseType === "sin-mesa" ? stepsSinMesa : stepsWithTable
  const maxStep = steps.length
  const isSinMesa = purchaseType === "sin-mesa"

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/compra")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (purchaseType && currentStep === maxStep && !transferReference) {
      setTransferReference(generateReference())
    }
  }, [purchaseType, currentStep, maxStep, transferReference])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<FormData>()

  const proofRegister = register("proofOfPayment", { required: true })
  const quantity = watch("quantity") ?? formData.quantity ?? 0
  const totalPrice = (quantity > 0 ? quantity : 0) * eventConfig.cover.online
  const totalPriceFormatted = totalPrice.toLocaleString("es-MX")

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Subir el comprobante de pago a Storage
      let proofOfPaymentUrl: string | null = null
      
      if (data.proofOfPayment && data.proofOfPayment.length > 0) {
        const file = data.proofOfPayment[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `payment-proofs/${fileName}`

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(`Error al subir el archivo: ${uploadError.message}`)
        }

        // Obtener la URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath)

        proofOfPaymentUrl = urlData.publicUrl
      }

      // 2. Guardar los datos en la base de datos
      if (!user) {
        throw new Error("Debes estar autenticado para realizar una compra")
      }

      let ref = transferReference || generateReference()
      let insertPayload = {
        user_id: user.id,
        table_id: data.table,
        quantity: formData.quantity,
        names: formData.names,
        proof_of_payment_url: proofOfPaymentUrl,
        total_price: totalPrice,
        status: 'pending' as const,
        reference: ref,
      }
      let { error: dbError } = await supabase.from('purchase_requests').insert(insertPayload)
      if (dbError?.code === '23505' && ref) {
        ref = generateReference()
        insertPayload.reference = ref
        const retry = await supabase.from('purchase_requests').insert(insertPayload)
        dbError = retry.error
      }
      if (dbError) {
        throw new Error(`Error al guardar los datos: ${dbError.message}`)
      }

      // 3. Si todo salió bien, mostrar mensaje de éxito
    setIsComplete(true)
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
      setSubmitError(error instanceof Error ? error.message : 'Error al enviar el formulario. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep < maxStep) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      // Volver a la elección de tipo de compra
      setPurchaseType(null)
    }
  }

  const handleSelectPurchaseType = (type: PurchaseType) => {
    setPurchaseType(type)
    if (type === "sin-mesa") {
      setFormData((prev) => ({ ...prev, table: "sin-mesa" }))
      setValue("table", "sin-mesa")
      setCurrentStep(1)
    } else if (type === "reserva-mesa-5") {
      setCurrentStep(1)
      updateQuantity("5")
    } else {
      setCurrentStep(1)
    }
  }

  const updateQuantity = (value: string) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        quantity: 0,
        names: [],
      }))
      setValue("quantity", 0, { shouldValidate: false })
      // Limpiar nombres del formulario
      Array.from({ length: 10 }).forEach((_, i) => {
        setValue(`names.${i}`, "")
      })
    } else {
      const numValue = Number.parseInt(value) || 0
      const newNames = numValue > 0 ? Array(numValue).fill("") : []
    setFormData((prev) => ({
      ...prev,
        quantity: numValue,
        names: newNames,
    }))
      setValue("quantity", numValue, { shouldValidate: true })
      // Inicializar nombres en el formulario
      newNames.forEach((_, i) => {
        setValue(`names.${i}`, "")
      })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return null // Redirigirá a login
  }

  // Paso 0: elegir tipo de compra
  if (purchaseType === null) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Elige tu tipo de cover</CardTitle>
          <CardDescription className="text-white/60">
            Selecciona una opción para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            onClick={() => handleSelectPurchaseType("reserva-mesa-5")}
            variant="outline"
            className="w-full justify-start border-white/20 bg-white/5 py-6 text-left text-white hover:bg-white/10 hover:text-white"
          >
            Reserva mesa (5 Covers)
          </Button>
          <Button
            type="button"
            onClick={() => handleSelectPurchaseType("con-mesa")}
            variant="outline"
            className="w-full justify-start border-white/20 bg-white/5 py-6 text-left text-white hover:bg-white/10 hover:text-white"
          >
            Cover con mesa
          </Button>
          <Button
            type="button"
            onClick={() => handleSelectPurchaseType("sin-mesa")}
            variant="outline"
            className="w-full justify-start border-white/20 bg-white/5 py-6 text-left text-white hover:bg-white/10 hover:text-white"
          >
            Cover sin mesa
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isComplete) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="pt-12 pb-12">
            <CheckCircleIcon className="mx-auto mb-6 h-20 w-20 text-green-500" />
            <h2 className="mb-4 text-3xl font-bold text-white">¡Solicitud Recibida!</h2>
            <p className="mb-6 text-pretty text-white/80">
              Hemos recibido tu solicitud de compra. Verificaremos tu pago y te confirmaremos por correo electrónico en
              las próximas 24 horas.
            </p>
            <div className="mb-8 rounded-lg border border-white/10 bg-black/30 p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">Resumen de tu compra</h3>
              <div className="space-y-2 text-white/80">
                <p>{formData.table === "sin-mesa" ? "Cover sin mesa" : `Mesa: #${selectedTableId ?? formData.table?.replace("mesa-", "")}`}</p>
                <p>Cantidad de covers: {formData.quantity}</p>
                <p className="text-2xl font-bold text-orange-500">Total: ${totalPriceFormatted}</p>
              </div>
            </div>
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-orange-500 text-black hover:bg-orange-400"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    currentStep >= step.id
                      ? "border-orange-500 bg-orange-500 text-black"
                      : "border-white/20 bg-white/5 text-white/40"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircleIcon className="h-6 w-6" /> : step.id}
                </div>
                <span className="mt-2 hidden text-xs text-white/60 md:block">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${currentStep > step.id ? "bg-orange-500" : "bg-white/20"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form 
        onSubmit={(e) => {
          if (currentStep === maxStep) {
            handleSubmit(onSubmit)(e)
          } else {
            e.preventDefault()
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && currentStep < maxStep) {
            e.preventDefault()
          }
        }}
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">{steps[currentStep - 1]?.title}</CardTitle>
            <CardDescription className="text-white/60">{steps[currentStep - 1]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {/* Step 1: Select Table (solo con mesa o reserva mesa 5) */}
              {!isSinMesa && currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="mb-4 block text-white">Selecciona tu mesa en el mapa</Label>
                    <TableMap
                      size="narrow"
                      selectedTable={selectedTableId}
                      onSelectTable={(tableId) => {
                        setSelectedTableId(tableId)
                        setFormData((prev) => ({ ...prev, table: `mesa-${tableId}` }))
                        setValue("table", `mesa-${tableId}`)
                      }}
                    />
                    {selectedTableId && (
                      <p className="mt-4 text-center text-sm text-green-400">✓ Mesa #{selectedTableId} seleccionada</p>
                    )}
                    {errors.table && (
                      <p className="mt-1 text-center text-sm text-red-500">Debes seleccionar una mesa</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Quantity (con mesa) o Step 1 (sin mesa) */}
              {((!isSinMesa && currentStep === 2) || (isSinMesa && currentStep === 1)) && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="quantity" className="text-white">
                      Cantidad de covers (Precio: ${eventConfig.cover.online} por cover)
                    </Label>
                    <Select
                      value={formData.quantity && formData.quantity > 0 ? formData.quantity.toString() : ""}
                      onValueChange={(value) => {
                        const numValue = Number.parseInt(value) || 0
                        updateQuantity(value)
                        setValue("quantity", numValue, { shouldValidate: true })
                        if (numValue >= 1) {
                          clearErrors("quantity")
                        }
                      }}
                    >
                      <SelectTrigger
                        id="quantity"
                        className="border-white/20 bg-white/5 text-white"
                      >
                        <SelectValue placeholder="Selecciona la cantidad" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-black/95">
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                          <SelectItem
                            key={num}
                            value={num.toString()}
                            className="text-white focus:bg-white/10"
                          >
                            {num} {num === 1 ? "cover" : "covers"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.quantity && (!formData.quantity || formData.quantity < 1) && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.quantity.message || "Selecciona una cantidad válida"}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                    <p className="text-2xl font-bold text-orange-500">
                      Total: {"$" + totalPriceFormatted}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Names (con mesa) o Step 2 (sin mesa) */}
              {((!isSinMesa && currentStep === 3) || (isSinMesa && currentStep === 2)) && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {Array.from({ length: quantity }).map((_, index) => (
                    <div key={index}>
                      <Label htmlFor={`name-${index}`} className="text-white">
                        Nombre para Cover {index + 1}
                      </Label>
                      <Input
                        id={`name-${index}`}
                        {...register(`names.${index}`, { required: "Este campo es obligatorio" })}
                        placeholder="Nombre completo"
                        value={formData.names?.[index] || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData((prev) => {
                            const currentNames = prev.names || Array(quantity).fill("")
                            const newNames = [...currentNames]
                            // Asegurar que el array tenga el tamaño correcto
                            while (newNames.length < quantity) {
                              newNames.push("")
                            }
                            newNames[index] = value
                            return {
                              ...prev,
                              names: newNames,
                            }
                          })
                          setValue(`names.${index}`, value, { shouldValidate: true })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            // Si no es el último nombre, ir al siguiente input
                            if (index < quantity - 1) {
                              const nextInput = document.getElementById(`name-${index + 1}`)
                              if (nextInput) {
                                nextInput.focus()
                              }
                            } else {
                              // Si es el último nombre, avanzar al siguiente paso si todos están llenos
                              const allNamesFilled = formData.names?.slice(0, quantity).every((name, i) => {
                                if (i === index) {
                                  return (e.target as HTMLInputElement).value.trim() !== ""
                                }
                                return name && typeof name === 'string' && name.trim() !== ""
                              })
                              if (allNamesFilled) {
                                handleNext()
                              }
                            }
                          }
                        }}
                        className="border-white/20 bg-white/5 text-white"
                      />
                      {errors.names?.[index] && <p className="mt-1 text-sm text-red-500">Este campo es obligatorio</p>}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Step 4: Términos y Condiciones (con mesa) o Step 3 (sin mesa) */}
              {((!isSinMesa && currentStep === 4) || (isSinMesa && currentStep === 3)) && (
                <motion.div
                  key="step-terms"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg border border-white/10 bg-black/30 p-6 space-y-4">
               
                    <ul className="space-y-3 text-sm text-white/80 list-disc list-inside">
                      {TERMS_CONTENT.map((item, i) => (
                        <li key={i} className="leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-white/30 bg-white/5 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-white/90 group-hover:text-white">
                      He leído y acepto los términos y condiciones anteriores
                    </span>
                  </label>
                </motion.div>
              )}

              {/* Step 5: Payment (con mesa) o Step 4 (sin mesa) */}
              {((!isSinMesa && currentStep === 5) || (isSinMesa && currentStep === 4)) && (
                <motion.div
                  key="step-payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-lg border border-white/10 bg-black/30 p-6">
                    <h3 className="mb-4 text-xl font-semibold text-white">Realiza tu transferencia</h3>
                    <div className="space-y-5 text-white/80">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">CLABE</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(eventConfig.payment.clabe)}
                            className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white"
                            title="Copiar CLABE"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="font-mono text-sm text-white">{eventConfig.payment.clabe}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">Banco</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(eventConfig.payment.bank)}
                            className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white"
                            title="Copiar banco"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-white">{eventConfig.payment.bank}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">Titular</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(eventConfig.payment.holder)}
                            className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white"
                            title="Copiar titular"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-white">{eventConfig.payment.holder}</p>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-3">
                        <span className="font-medium">Monto a transferir:</span>
                        <span className="text-2xl font-bold text-orange-500">${totalPriceFormatted}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">Referencia</span>
                          <button
                            type="button"
                            onClick={() => transferReference && navigator.clipboard.writeText(transferReference)}
                            className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white disabled:opacity-50"
                            title="Copiar referencia"
                            disabled={!transferReference}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="font-mono text-sm text-white">{transferReference || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="proof" className="text-white">
                      Comprobante de pago (Imagen o PDF)
                    </Label>
                    <Input
                      id="proof"
                      type="file"
                      accept="image/*,.pdf"
                      {...proofRegister}
                      onChange={(e) => {
                        proofRegister.onChange(e)
                        setHasProofFile(!!e.target.files?.length)
                      }}
                      className="border-white/20 bg-white/5 text-white file:mr-4 file:rounded file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-orange-400"
                    />
                  </div>
                  
                  {submitError && (
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                      <p className="text-sm text-red-400">{submitError}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            type="button"
            onClick={handleBack}
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Atrás
          </Button>

          {currentStep < maxStep ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={(() => {
                const namesFilled = () => {
                  const qty = formData.quantity || 0
                  if (qty < 1) return false
                  if (!formData.names || formData.names.length < qty) return false
                  for (let i = 0; i < qty; i++) {
                    const name = formData.names[i]
                    if (!name || (typeof name === "string" && name.trim() === "")) return false
                  }
                  return true
                }
                if (isSinMesa) {
                  if (currentStep === 1) return !formData.quantity || formData.quantity < 1
                  if (currentStep === 2) return !namesFilled()
                  if (currentStep === 3) return !termsAccepted
                } else {
                  if (currentStep === 1) return !formData.table
                  if (currentStep === 2) return !formData.quantity || formData.quantity < 1
                  if (currentStep === 3) return !namesFilled()
                  if (currentStep === 4) return !termsAccepted
                }
                return false
              })()}
              className="bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-50"
            >
              Siguiente
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isSubmitting || !hasProofFile}
              className="bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-50"
            >
              {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
