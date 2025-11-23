import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/server'
import { requireAuthForAPI } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthForAPI()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const { id } = await params
    const supabase = await createSupabaseClient()
    
    let query = supabase
      .from('agent_tasks')
      .select('*, agents(name, type)')
      .eq('id', id)
      .single()

    if (user.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ task: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

