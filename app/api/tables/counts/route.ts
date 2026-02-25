import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase-service'

export async function GET() {
  const supabase = supabaseService
  if (!supabase) {
    return NextResponse.json(
      { error: 'Conteos no configurados' },
      { status: 503 }
    )
  }

  const { data, error } = await supabase
    .from('tickets')
    .select('table_id')
    .in('status', ['approved', 'used'])

  if (error) {
    console.error('[api/tables/counts]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const countMap: Record<string, number> = {}
  data?.forEach((row: { table_id: string }) => {
    const id = row.table_id?.replace(/^mesa-/, '') || row.table_id
    if (id) {
      countMap[id] = (countMap[id] || 0) + 1
    }
  })

  return NextResponse.json(countMap)
}
