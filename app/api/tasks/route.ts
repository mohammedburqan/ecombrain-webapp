import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createSupabaseServerComponentClient()
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const agentId = searchParams.get('agent_id')
    const isAdmin = user.role === 'admin'

    let query = supabase
      .from('agent_tasks')
      .select('*, agents(name, type)')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ tasks: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

