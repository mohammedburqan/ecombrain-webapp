import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/server'
import { requireAuthForAPI } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthForAPI()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = createSupabaseClient()
    
    // Get store creation success rate
    const { data: jobs } = await supabase
      .from('store_creation_jobs')
      .select('deployment_status')
      .eq('user_id', user.id)

    const totalJobs = jobs?.length || 0
    const successfulJobs = jobs?.filter((j) => j.deployment_status === 'live').length || 0
    const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0

    // Get agent task success rate
    const { data: tasks } = await supabase
      .from('agent_tasks')
      .select('status')
      .eq('user_id', user.id)

    const totalTasks = tasks?.length || 0
    const successfulTasks = tasks?.filter((t) => t.status === 'completed').length || 0
    const taskSuccessRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0

    // Get active stores count
    const { data: stores } = await supabase
      .from('shopify_stores')
      .select('status')
      .eq('user_id', user.id)

    const activeStores = stores?.filter((s) => s.status === 'active').length || 0

    return NextResponse.json({
      roi: {
        storeCreationSuccessRate: successRate,
        taskSuccessRate,
        totalStores: stores?.length || 0,
        activeStores,
        totalJobs,
        successfulJobs,
        totalTasks,
        successfulTasks,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ROI data' },
      { status: 500 }
    )
  }
}

