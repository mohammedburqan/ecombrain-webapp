import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createSupabaseServerComponentClient()
    
    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agent_id')
    const metricName = searchParams.get('metric_name')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('agent_metrics')
      .select('*')
      .order('timestamp', { ascending: false })

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    if (metricName) {
      query = query.eq('metric_name', metricName)
    }

    if (startDate) {
      query = query.gte('timestamp', startDate)
    }

    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    // If not admin, only show metrics for user's tasks
    if (user.role !== 'admin') {
      // This would need a join or subquery in production
      // For now, admins can see all metrics
      if (user.role !== 'admin') {
        return NextResponse.json({ metrics: [] })
      }
    }

    const { data, error } = await query.limit(1000)

    if (error) throw error

    return NextResponse.json({ metrics: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

