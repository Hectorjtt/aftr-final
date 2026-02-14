"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { getTableCounts } from "@/lib/tables"

type Table = {
  id: number
  section: string
  minCovers: number
  position: { row: number; col: number }
}

const tables: Table[] = [
  // Segundo Anillo - Top Row (min 10 covers)
  { id: 10, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 0, col: 0 } },
  { id: 11, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 0, col: 1 } },
  { id: 12, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 0, col: 2 } },
  { id: 13, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 0, col: 3 } },
  { id: 14, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 0, col: 4 } },
  { id: 15, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 0, col: 5 } },
  { id: 16, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 0, col: 6 } },

  // Primer Anillo - Row 2 (min 10 covers) - Movido una posición a la derecha
  { id: 20, section: "PRIMER ANILLO", minCovers: 10, position: { row: 1, col: 1 } },
  { id: 21, section: "PRIMER ANILLO", minCovers: 10, position: { row: 1, col: 2 } },
  { id: 22, section: "PRIMER ANILLO", minCovers: 10, position: { row: 1, col: 3 } },
  { id: 23, section: "PRIMER ANILLO", minCovers: 10, position: { row: 1, col: 4 } },
  { id: 24, section: "PRIMER ANILLO", minCovers: 10, position: { row: 1, col: 5 } },
  { id: 25, section: "PRIMER ANILLO", minCovers: 10, position: { row: 1, col: 6 } },

  // Mesas en Pista - Row 3 (min 12 covers)
  { id: 31, section: "MESAS EN PISTA", minCovers: 12, position: { row: 2, col: 0 } },
  { id: 32, section: "MESAS EN PISTA", minCovers: 12, position: { row: 2, col: 1 } },
  { id: 33, section: "MESAS EN PISTA", minCovers: 12, position: { row: 2, col: 2 } },
  { id: 34, section: "MESAS EN PISTA", minCovers: 12, position: { row: 2, col: 4 } },
  { id: 35, section: "MESAS EN PISTA", minCovers: 12, position: { row: 2, col: 5 } },
  { id: 36, section: "MESAS EN PISTA", minCovers: 12, position: { row: 2, col: 6 } },

  // Mesas en Pista - Row 4 (min 12 covers)
  { id: 41, section: "MESAS EN PISTA", minCovers: 12, position: { row: 3, col: 0 } },
  { id: 42, section: "MESAS EN PISTA", minCovers: 12, position: { row: 3, col: 1 } },
  { id: 43, section: "MESAS EN PISTA", minCovers: 12, position: { row: 3, col: 2 } },
  { id: 44, section: "MESAS EN PISTA", minCovers: 12, position: { row: 3, col: 4 } },
  { id: 45, section: "MESAS EN PISTA", minCovers: 12, position: { row: 3, col: 5 } },
  { id: 46, section: "MESAS EN PISTA", minCovers: 12, position: { row: 3, col: 6 } },

  // Primer Anillo - Row 5 (min 10 covers) - Movido una posición a la derecha
  { id: 50, section: "PRIMER ANILLO", minCovers: 10, position: { row: 4, col: 1 } },
  { id: 51, section: "PRIMER ANILLO", minCovers: 10, position: { row: 4, col: 2 } },
  { id: 52, section: "PRIMER ANILLO", minCovers: 10, position: { row: 4, col: 3 } },
  { id: 53, section: "PRIMER ANILLO", minCovers: 10, position: { row: 4, col: 4 } },
  { id: 54, section: "PRIMER ANILLO", minCovers: 10, position: { row: 4, col: 5 } },
  { id: 55, section: "PRIMER ANILLO", minCovers: 10, position: { row: 4, col: 6 } },

  // Segundo Anillo - Bottom Row (min 10 covers) - Movido una posición a la derecha
  { id: 60, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 5, col: 1 } },
  { id: 61, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 5, col: 2 } },
  { id: 62, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 5, col: 3 } },
  { id: 63, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 5, col: 4 } },
  { id: 64, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 5, col: 5 } },
  { id: 65, section: "SEGUNDO ANILLO", minCovers: 10, position: { row: 5, col: 6 } },
]

const djTables = [
  { id: 2, name: "2", position: 0 },
  { id: 3, name: "3", position: 1 },
  { id: 4, name: "4", position: 3 }, // Position 2 will be DJ booth
  { id: 5, name: "5", position: 4 },
  { id: 6, name: "6", position: 5 },
]

type TableMapSize = 'default' | 'compact' | 'narrow'

type TableMapProps = {
  selectedTable: number | null
  onSelectTable: (tableId: number) => void
  /** default = grande, compact = admin, narrow = compra (cabe en iPhone) */
  size?: TableMapSize
  /** @deprecated Usa size="compact" en su lugar */
  compact?: boolean
}

export function TableMap({ selectedTable, onSelectTable, size: sizeProp, compact: compactProp }: TableMapProps) {
  const size = sizeProp ?? (compactProp ? 'compact' : 'default')
  const compact = size === 'compact'
  const narrow = size === 'narrow'
  const small = compact || narrow
  // Conteo de tickets (aprobados + usados) por mesa. Clave = id numérico ("32", "10", etc.)
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadTableCounts()
    const interval = setInterval(loadTableCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadTableCounts = async () => {
    const { data } = await getTableCounts()
    if (data) {
      setTableCounts(data)
    }
  }

  const getTableAtPosition = (row: number, col: number) => {
    return tables.find((t) => t.position.row === row && t.position.col === col)
  }

  // Ocupada = la mesa tiene al menos 5 tickets aprobados o usados (todas las mesas mismo mínimo)
  const MIN_COVERS_OCCUPIED = 5
  const isTableOccupied = (tableId: number) => {
    const count = tableCounts[tableId.toString()] ?? 0
    return count >= MIN_COVERS_OCCUPIED
  }

  const getSectionColor = (section: string, tableId: number) => {
    if (isTableOccupied(tableId)) {
      return "bg-gray-700/50 border-gray-600/60 hover:bg-gray-700/70 opacity-60"
    }
    // Todas las mesas tienen exactamente el mismo color que Segundo Anillo
    return "bg-red-950/30 border-red-900/60 hover:bg-red-950/50"
  }

  const getSelectedColor = (section: string, tableId: number) => {
    if (isTableOccupied(tableId)) {
      return "bg-gray-600 border-gray-500 text-white opacity-60"
    }
    // Todas las mesas seleccionadas tienen exactamente el mismo color que Segundo Anillo
    return "bg-red-700 border-red-900/80 text-white"
  }

  return (
    <div className={cn(
      "mx-auto w-full overflow-x-auto",
      narrow && "flex justify-center px-1",
      compact && !narrow && "flex justify-center px-2",
      !small && "px-4 lg:px-8"
    )}>
      <div className={cn(
        narrow && "min-w-0 w-full max-w-[380px] p-1",
        compact && !narrow && "min-w-[600px] max-w-[720px] p-2",
        !small && "min-w-[900px] p-4 lg:p-6"
      )}>
        <div className="relative grid gap-1">
          {/* Main Layout Container */}
          <div className={cn(
            "grid",
            narrow && "grid-cols-[50px_1fr_45px] gap-1",
            compact && !narrow && "grid-cols-[100px_1fr_70px] gap-2 lg:gap-3",
            !small && "grid-cols-[180px_1fr_120px] gap-4 lg:gap-6"
          )}>
            {/* Left Side - BARRA + RPS (mesa 1, abajo y alejada) */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-1 min-h-0 items-center justify-center rounded-lg border-2 border-white/20 bg-gradient-to-b from-gray-900 to-black">
                <div className={cn("rotate-180 text-center font-bold text-white [writing-mode:vertical-lr]", narrow && "text-[8px]")}>BARRA</div>
              </div>
              <motion.button
                type="button"
                onClick={() => onSelectTable(1)}
                whileHover={{ scale: isTableOccupied(1) ? 1 : 1.05 }}
                whileTap={{ scale: isTableOccupied(1) ? 1 : 0.95 }}
                className={cn(
                  "relative flex aspect-square items-center justify-center self-center rounded-lg border-2 font-bold transition-all",
                  narrow ? "h-9 w-9" : compact ? "h-11 w-11" : "h-14 w-14",
                  selectedTable === 1 ? getSelectedColor("RPS", 1) : getSectionColor("RPS", 1),
                  selectedTable === 1 && !isTableOccupied(1) ? "text-white shadow-lg shadow-red-500/50" : "text-white",
                )}
              >
                <div className="text-center">
                  <div className={cn(narrow ? "text-xs" : compact ? "text-sm" : "text-base")}>RPS</div>
                </div>
                {isTableOccupied(1) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("rounded bg-gray-900/80 font-bold text-white", narrow ? "px-0.5 py-0 text-[5px]" : compact ? "px-1 py-0.5 text-[6px]" : "px-1.5 py-0.5 text-[7px]")}>
                      OCUPADA
                    </span>
                  </div>
                )}
              </motion.button>
            </div>

            {/* Center - Main Table Area */}
            <div className={narrow ? "space-y-1" : compact ? "space-y-2" : "space-y-4"}>
              {[
                { row: 0, label: "SEGUNDO ANILLO - Mínimo 10 covers", cols: 7 },
                { row: 1, label: "PRIMER ANILLO - Mínimo 10 covers", cols: 6, offset: 0 },
                { row: 2, label: "MESAS EN PISTA - Mínimo 12 covers", cols: 7, hasColumn: true },
                { row: 3, label: "MESAS EN PISTA - Mínimo 12 covers", cols: 7, hasColumn: true },
                { row: 4, label: "PRIMER ANILLO - Mínimo 10 covers", cols: 6, offset: 0 },
                { row: 5, label: "SEGUNDO ANILLO - Mínimo 10 covers", cols: 7 },
              ].map(({ row, label, cols, offset = 0, hasColumn = false }) => {
                // Determinar el color de la etiqueta según la sección
                const getLabelColor = () => {
                  if (label.includes("SEGUNDO ANILLO")) return "border-red-900/50 bg-red-950/20 text-red-200"
                  if (label.includes("PRIMER ANILLO")) return "border-red-700/50 bg-red-900/20 text-red-200"
                  if (label.includes("MESAS EN PISTA")) return "border-red-500/60 bg-red-800/20 text-red-200"
                  return "border-red-700/50 bg-red-900/20 text-red-200"
                }
                
                return (
                <div key={row} className="space-y-1">
                  {/* Section Label */}
                  <div className={cn("rounded border text-center font-semibold", narrow ? "px-1 py-0.5 text-[8px]" : compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs", getLabelColor())}>
                    {label}
                  </div>

                  {/* Tables Grid */}
                  <div className={cn("grid grid-cols-7", narrow ? "gap-0.5" : compact ? "gap-1.5" : "gap-3")}>
                    {Array.from({ length: 7 }).map((_, colIndex) => {
                      const table = getTableAtPosition(row, colIndex)

                      // Render column in the middle for "MESAS EN PISTA"
                      if (hasColumn && colIndex === 3) {
                        return (
                          <div
                            key={`column-${row}-${colIndex}`}
                            className="flex aspect-square items-center justify-center rounded-lg border-2 border-white/10 bg-black"
                          >
                            <div className="h-full w-2 rounded bg-gradient-to-b from-gray-800 to-black" />
                          </div>
                        )
                      }

                      if (!table) {
                        return <div key={`empty-${row}-${colIndex}`} className="aspect-square" />
                      }

                      const isSelected = selectedTable === table.id
                      const isOccupied = isTableOccupied(table.id)

                      return (
                        <motion.button
                          key={table.id}
                          type="button"
                          onClick={() => onSelectTable(table.id)}
                          whileHover={{ scale: isOccupied ? 1 : 1.05 }}
                          whileTap={{ scale: isOccupied ? 1 : 0.95 }}
                          className={cn(
                            "relative flex aspect-square items-center justify-center rounded-lg border-2 font-bold transition-all",
                            isSelected ? getSelectedColor(table.section, table.id) : getSectionColor(table.section, table.id),
                            isSelected && !isOccupied ? "text-white shadow-lg shadow-red-500/50" : "text-white",
                          )}
                        >
                          <div className="text-center">
                            <div className={narrow ? "text-sm" : compact ? "text-lg" : "text-2xl"}>{table.id}</div>
                            <div className={cn(narrow ? "text-[7px]" : compact ? "text-[8px]" : "text-[10px]", "opacity-80")}>Min {table.minCovers}</div>
                            {isOccupied && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={cn("rounded bg-gray-900/80 font-bold text-white", narrow ? "px-1 py-0.5 text-[6px]" : "px-2 py-0.5 text-[9px]")}>
                                  OCUPADA
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
                )
              })}
            </div>

            <div className={cn("flex flex-col justify-center", narrow ? "space-y-0.5" : compact ? "space-y-1" : "space-y-2")}>
              <div className={cn("rounded border border-red-700/50 bg-red-900/20 text-center font-semibold text-red-200", narrow ? "px-0.5 py-0.5 text-[6px]" : compact ? "px-1 py-0.5 text-[8px]" : "px-2 py-1.5 text-[10px]")}>
                ESPACIO DJ - Mínimo 8 covers
              </div>

              {/* DJ Tables Grid - 6 positions total with same size as main tables */}
              <div className="flex justify-center">
              <div className={cn("grid grid-cols-1", narrow ? "w-[36px] gap-0.5" : compact ? "w-[45px] gap-1" : "w-[60px] gap-2")}>
                {Array.from({ length: 6 }).map((_, index) => {
                  // Position 2 is the DJ booth
                  if (index === 2) {
                    return (
                      <div
                        key="dj-booth"
                        className={cn("flex items-center justify-center rounded-lg border-2 border-red-900/60 bg-gradient-to-br from-red-900/40 to-red-800/40", narrow ? "h-[36px] w-[36px]" : compact ? "h-[45px] w-[45px]" : "h-[60px] w-[60px]")}
                      >
                        <div className="text-center">
                          <div className={narrow ? "text-xs" : compact ? "text-sm" : "text-lg"}>🎧</div>
                          <div className={cn(narrow ? "text-[6px]" : compact ? "text-[8px]" : "text-[10px]", "font-bold text-white")}>DJ</div>
                        </div>
                      </div>
                    )
                  }

                  const table = djTables.find((t) => t.position === index)
                  if (!table) return null

                  const isSelected = selectedTable === table.id
                  const isOccupied = isTableOccupied(table.id)

                  return (
                    <motion.button
                      key={table.id}
                      type="button"
                      onClick={() => onSelectTable(table.id)}
                      whileHover={{ scale: isOccupied ? 1 : 1.05 }}
                      whileTap={{ scale: isOccupied ? 1 : 0.95 }}
                        className={cn(
                        "relative flex items-center justify-center rounded-lg border-2 font-bold transition-all",
                        narrow ? "h-[36px] w-[36px]" : compact ? "h-[45px] w-[45px]" : "h-[60px] w-[60px]",
                        isOccupied
                          ? isSelected
                            ? "border-gray-500 bg-gray-600 text-white opacity-60"
                            : "border-gray-600/60 bg-gray-700/50 text-white opacity-60 hover:bg-gray-700/70"
                          : isSelected
                          ? "border-red-900/80 bg-red-700 text-white shadow-lg shadow-red-500/50"
                          : "border-red-900/60 bg-red-950/30 text-white hover:bg-red-950/50",
                      )}
                    >
                      <div className="text-center">
                        <div className={narrow ? "text-xs" : compact ? "text-sm" : "text-xl"}>{table.name}</div>
                        <div className={cn(narrow ? "text-[6px]" : compact ? "text-[7px]" : "text-[9px]", "opacity-80")}>Min 8</div>
                        {isOccupied && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={cn("rounded bg-gray-900/80 font-bold text-white", narrow ? "px-0.5 py-0.5 text-[5px]" : "px-1 py-0.5 text-[8px]")}>
                              OCUPADA
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
