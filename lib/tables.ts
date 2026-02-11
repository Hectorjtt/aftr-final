import { supabase } from './supabase'

// Función para obtener el estado de todas las mesas
export async function getTableStatuses() {
  const { data, error } = await supabase
    .from('table_status')
    .select('*')

  if (error) {
    console.error('Error al obtener estado de mesas:', error)
    return { data: null, error }
  }

  // Convertir a un objeto más fácil de usar: { table_id: is_occupied }
  const statusMap: Record<string, boolean> = {}
  data?.forEach((status) => {
    statusMap[status.table_id] = status.is_occupied
  })

  return { data: statusMap, error: null }
}



