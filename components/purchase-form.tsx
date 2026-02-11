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
import { TableMap } from "@/components/table-map"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { motion, AnimatePresence } from "framer-motion"

type FormData = {
  table: string
  quantity: number
  names: string[]
  proofOfPayment: FileList
}

const steps = [
  { id: 1, title: "Seleccionar Mesa", description: "Elige la mesa para tu cover" },
  { id: 2, title: "Cantidad de Covers", description: "¿Cuántos covers necesitas?" },
  { id: 3, title: "Nombres", description: "Ingresa los nombres para cada cover" },
  { id: 4, title: "Pago", description: "Completa tu transferencia" },
]

export function PurchaseForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<FormData>>({
    quantity: 1,
    names: [""],
  })
  const [isComplete, setIsComplete] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { user, loading } = useSupabaseUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/compra")
    }
  }, [loading, user, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<FormData>()

  const quantity = watch("quantity") ?? formData.quantity ?? 0
  const totalPrice = (quantity > 0 ? quantity : 0) * eventConfig.cover.online

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

      const { error: dbError } = await supabase
        .from('purchase_requests')
        .insert({
          user_id: user.id,
          table_id: data.table,
          quantity: formData.quantity,
          names: formData.names,
          proof_of_payment_url: proofOfPaymentUrl,
          total_price: totalPrice,
          status: 'pending',
        })

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
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
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
                <p>Mesa: #{selectedTableId}</p>
                <p>Cantidad de covers: {formData.quantity}</p>
                <p className="text-2xl font-bold text-orange-500">Total: ${totalPrice}</p>
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
          // Solo permitir submit en el último paso
          if (currentStep === 4) {
            handleSubmit(onSubmit)(e)
          } else {
            e.preventDefault()
          }
        }}
        onKeyDown={(e) => {
          // Prevenir que Enter envíe el formulario si no estamos en el último paso
          if (e.key === "Enter" && currentStep < 4) {
            e.preventDefault()
          }
        }}
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">{steps[currentStep - 1].title}</CardTitle>
            <CardDescription className="text-white/60">{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {/* Step 1: Select Table */}
              {currentStep === 1 && (
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

              {/* Step 2: Quantity */}
              {currentStep === 2 && (
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
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={(formData.quantity && formData.quantity > 0) ? formData.quantity : ""}
                      {...register("quantity", { 
                        required: "Este campo es obligatorio",
                        min: { value: 1, message: "Mínimo 1 cover" },
                        validate: (value) => {
                          const numValue = Number(value)
                          if (isNaN(numValue) || numValue < 1) {
                            return "Mínimo 1 cover"
                          }
                          return true
                        }
                      })}
                      onChange={(e) => {
                        const value = e.target.value
                        updateQuantity(value)
                        // Limpiar errores si el valor es válido
                        if (value && Number.parseInt(value) >= 1) {
                          clearErrors("quantity")
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          // Solo avanzar si la cantidad es válida
                          if (formData.quantity && formData.quantity >= 1) {
                            handleNext()
                          }
                        }
                      }}
                      className="border-white/20 bg-white/5 text-white"
                    />
                    {errors.quantity && (!formData.quantity || formData.quantity < 1) && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.quantity.message || "Ingresa una cantidad válida (mínimo 1)"}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                    <p className="text-2xl font-bold text-orange-500">
                      Total: ${totalPrice > 0 ? totalPrice : "0.00"}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Names */}
              {currentStep === 3 && (
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

              {/* Step 4: Payment */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-lg border border-white/10 bg-black/30 p-6">
                    <h3 className="mb-4 text-xl font-semibold text-white">Realiza tu transferencia</h3>
                    <div className="space-y-3 text-white/80">
                      <div className="flex justify-between">
                        <span className="font-medium">Banco:</span>
                        <span>{eventConfig.payment.bank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Cuenta:</span>
                        <span>{eventConfig.payment.account}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">CLABE:</span>
                        <span className="font-mono text-sm">{eventConfig.payment.clabe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Titular:</span>
                        <span>{eventConfig.payment.holder}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-3">
                        <span className="font-medium">Monto a transferir:</span>
                        <span className="text-2xl font-bold text-orange-500">${totalPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Referencia:</span>
                        <span className="font-mono text-sm">
                          {eventConfig.event.shortName}-{Date.now()}
                        </span>
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
                      {...register("proofOfPayment", { required: true })}
                      className="border-white/20 bg-white/5 text-white file:mr-4 file:rounded file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-orange-400"
                    />
                    {errors.proofOfPayment && (
                      <p className="mt-1 text-sm text-red-500">Debes subir el comprobante de pago</p>
                    )}
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
            disabled={currentStep === 1}
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Atrás
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !formData.table) ||
                (currentStep === 2 && (!formData.quantity || formData.quantity < 1)) ||
                (currentStep === 3 && (() => {
                  const qty = formData.quantity || 0
                  if (qty < 1) return true
                  if (!formData.names || formData.names.length < qty) return true
                  // Verificar que todos los nombres requeridos estén llenos
                  for (let i = 0; i < qty; i++) {
                    const name = formData.names[i]
                    if (!name || (typeof name === 'string' && name.trim() === "")) {
                      return true
                    }
                  }
                  return false
                })())
              }
              className="bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-50"
            >
              Siguiente
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isSubmitting}
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
