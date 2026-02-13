import { supabase } from './supabase'

/**
 * Cuenta de tickets aprobados o usados por mesa.
 * La mesa se considera ocupada cuando count >= minCovers de esa mesa (eso se calcula en el mapa).
 * table_id en tickets viene como "mesa-32"; normalizamos a "32" para coincidir con el id del mapa.
 */
export async function getTableCounts(): Promise<{ data: Record<string, number> | null; error: unknown }> {
  const { data, error } = await supabase
    .from('tickets')
    .select('table_id')
    .in('status', ['approved', 'used'])

  if (error) {
    console.error('Error al obtener conteos por mesa:', error)
    return { data: null, error }
  }

  const countMap: Record<string, number> = {}
  data?.forEach((row: { table_id: string }) => {
    const id = row.table_id?.replace(/^mesa-/, '') || row.table_id
    if (id) {
      countMap[id] = (countMap[id] || 0) + 1
    }
  })

  return { data: countMap, error: null }
}



