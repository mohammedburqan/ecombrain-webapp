import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/server'
import { requireAuthForAPI } from '@/lib/auth'
import { agentRegistry } from '@/lib/agents/registry'

export async function POST(
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
    const body = await request.json()

    const agent = agentRegistry.get(id)
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const supabase = createSupabaseClient()
    
    // Create task record
    const { data: task } = await supabase
      .from('agent_tasks')
      .insert({
        agent_id: id,
        user_id: user.id,
        task_type: body.action || 'execute',
        input_data: body.input || {},
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Execute agent
    const output = await agent.execute(body.input || {}, {
      userId: user.id,
      taskId: task?.id,
    })

    // Update task record
    await supabase
      .from('agent_tasks')
      .update({
        status: output.success ? 'completed' : 'failed',
        output_data: output,
        completed_at: new Date().toISOString(),
      })
      .eq('id', task?.id)

    return NextResponse.json({ output, taskId: task?.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to execute agent' },
      { status: 500 }
    )
  }
}

