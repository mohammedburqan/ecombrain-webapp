import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { requireAuthForAPI } from '@/lib/auth'
import { agentRegistry } from '@/lib/agents/registry'
import { BaseAgent } from '@/lib/agents/base-agent'
import { AgentType } from '@/types/database'
import { MarketIntelligenceAgent } from '@/lib/agents/market-intelligence'
import { CopywritingAgent } from '@/lib/agents/copywriting'
import { NicheSelectionAgent } from '@/lib/agents/niche-selection'
import { ColorSchemeAgent } from '@/lib/agents/color-scheme'
import { MarketGapAgent } from '@/lib/agents/market-gap'
import { ProductManagementAgent } from '@/lib/agents/product-management'
import { ShopifyStoreCreationAgent } from '@/lib/agents/shopify-store-creation'
import { ShopifyDeploymentAgent } from '@/lib/agents/shopify-deployment'
import { VideoGenerationAgent } from '@/lib/agents/video-generation'

// Factory function to create agent instances from database records
function createAgentFromRecord(record: {
  id: string
  name: string
  type: AgentType
  config?: Record<string, any>
}): BaseAgent {
  const { id, name, type, config = {} } = record

  switch (type) {
    case 'market_intelligence':
      return new MarketIntelligenceAgent(id, name, config)
    case 'copywriting':
      return new CopywritingAgent(id, name, config)
    case 'niche_selection':
      return new NicheSelectionAgent(id, name, config)
    case 'color_scheme':
      return new ColorSchemeAgent(id, name, config)
    case 'market_gap':
      return new MarketGapAgent(id, name, config)
    case 'product_management':
      return new ProductManagementAgent(id, name, config)
    case 'shopify_store_creation':
      return new ShopifyStoreCreationAgent(id, name, config)
    case 'shopify_deployment':
      return new ShopifyDeploymentAgent(id, name, config)
    case 'video_generation':
      return new VideoGenerationAgent(id, name, config)
    default:
      throw new Error(`Unknown agent type: ${type}`)
  }
}

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

    // Parse request body with error handling
    let body: any = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseClient()

    // Try to get agent from registry first
    let agent = agentRegistry.get(id)

    // If not in registry, load from database
    if (!agent) {
      const { data: agentRecord, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (agentError || !agentRecord) {
        return NextResponse.json(
          { error: 'Agent not found or inactive' },
          { status: 404 }
        )
      }

      // Create agent instance from database record
      try {
        agent = createAgentFromRecord(agentRecord)
        // Register it in the registry for future use
        agentRegistry.register(agent)
      } catch (createError: any) {
        return NextResponse.json(
          { error: `Failed to create agent instance: ${createError.message}` },
          { status: 500 }
        )
      }
    }

    // Create task record with fallback for RLS errors
    let taskResult = await supabase
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

    // If RLS error occurs, try with service role client
    if (taskResult.error && (taskResult.error.message.includes('policy') || taskResult.error.message.includes('recursion') || taskResult.error.message.includes('infinite'))) {
      try {
        const serviceClient = createSupabaseServiceRoleClient()
        taskResult = await serviceClient
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
      } catch (serviceError: any) {
        console.error('Service role client also failed:', serviceError)
      }
    }

    if (taskResult.error) {
      return NextResponse.json(
        { error: `Failed to create task: ${taskResult.error.message}` },
        { status: 400 }
      )
    }

    const task = taskResult.data

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
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to execute agent' },
      { status: error.message?.includes('Invalid JSON') ? 400 : 500 }
    )
  }
}

