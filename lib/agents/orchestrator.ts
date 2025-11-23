import { BaseAgent, TaskInput, TaskOutput } from './base-agent'
import { agentRegistry } from './registry'
import { geminiClient } from '../ai/gemini'
import { aiRouter } from '../ai/router'
import { createSupabaseServerClient } from '../supabase/server'

export interface WorkflowStep {
  agentId: string
  agentType: string
  action: string
  input: TaskInput
  dependsOn?: string[] // IDs of previous steps this depends on
}

export interface WorkflowResult {
  success: boolean
  steps: Array<{
    stepId: string
    agentId: string
    success: boolean
    output?: any
    error?: string
  }>
  finalOutput?: any
}

export class AgentOrchestrator {
  async executeWorkflow(
    task: string,
    userId: string,
    context?: Record<string, any>
  ): Promise<WorkflowResult> {
    try {
      // Get available agents
      const availableAgents = agentRegistry.getActive()
      const agentNames = availableAgents.map((a) => a.getName())

      // Use Gemini to plan the workflow
      const workflowPlan = await geminiClient.orchestrateAgents(
        task,
        agentNames,
        context
      )

      // Create collaboration session
      const supabase = createSupabaseServerClient()
      const { data: session } = await supabase
        .from('collaboration_sessions')
        .insert({
          session_name: `Workflow: ${task.substring(0, 50)}`,
          agents_involved: workflowPlan.selectedAgents,
          workflow_data: workflowPlan,
          status: 'running',
        })
        .select()
        .single()

      // Execute workflow steps
      const results: WorkflowResult['steps'] = []
      const stepOutputs: Record<string, any> = {}

      for (const step of workflowPlan.workflow) {
        const agent = availableAgents.find((a) => a.getName() === step.agent)
        
        if (!agent) {
          results.push({
            stepId: step.agent,
            agentId: '',
            success: false,
            error: `Agent ${step.agent} not found`,
          })
          continue
        }

        // Prepare input with context from previous steps
        const stepInput = {
          ...step.input,
          ...context,
          ...stepOutputs, // Include outputs from previous steps
        }

        // Create task record
        const { data: taskRecord } = await supabase
          .from('agent_tasks')
          .insert({
            agent_id: agent.getId(),
            user_id: userId,
            task_type: step.action,
            input_data: stepInput,
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .select()
          .single()

        try {
          // Execute agent
          const output = await agent.execute(stepInput, {
            ...context,
            taskId: taskRecord?.id,
            sessionId: session?.id,
          })

          // Update task record
          await supabase
            .from('agent_tasks')
            .update({
              status: output.success ? 'completed' : 'failed',
              output_data: output,
              completed_at: new Date().toISOString(),
            })
            .eq('id', taskRecord?.id)

          results.push({
            stepId: step.agent,
            agentId: agent.getId(),
            success: output.success,
            output: output.data,
            error: output.error,
          })

          if (output.success && output.data) {
            stepOutputs[step.agent] = output.data
          }

          // If step failed and is critical, stop workflow
          if (!output.success && step.action.includes('critical')) {
            break
          }
        } catch (error) {
          await supabase
            .from('agent_tasks')
            .update({
              status: 'failed',
              output_data: { error: error instanceof Error ? error.message : 'Unknown error' },
              completed_at: new Date().toISOString(),
            })
            .eq('id', taskRecord?.id)

          results.push({
            stepId: step.agent,
            agentId: agent.getId(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Update session status
      const allSuccess = results.every((r) => r.success)
      await supabase
        .from('collaboration_sessions')
        .update({
          status: allSuccess ? 'completed' : 'failed',
          workflow_data: { ...workflowPlan, results },
        })
        .eq('id', session?.id)

      return {
        success: allSuccess,
        steps: results,
        finalOutput: stepOutputs,
      }
    } catch (error) {
      return {
        success: false,
        steps: [],
        finalOutput: undefined,
      }
    }
  }

  async executePredefinedWorkflow(
    workflowName: string,
    input: TaskInput,
    userId: string
  ): Promise<WorkflowResult> {
    // Predefined workflows for common tasks
    const workflows: Record<string, WorkflowStep[]> = {
      store_creation: [
        {
          agentId: 'niche_selection',
          agentType: 'niche_selection',
          action: 'analyze_niche',
          input: { nicheDescription: input.nicheDescription },
        },
        {
          agentId: 'color_scheme',
          agentType: 'color_scheme',
          action: 'recommend_colors',
          input: { niche: input.niche },
          dependsOn: ['niche_selection'],
        },
        {
          agentId: 'product_management',
          agentType: 'product_management',
          action: 'find_products',
          input: { niche: input.niche },
          dependsOn: ['niche_selection'],
        },
        {
          agentId: 'shopify_store_creation',
          agentType: 'shopify_store_creation',
          action: 'create_store',
          input: { storeName: input.storeName, userId },
          dependsOn: [],
        },
        {
          agentId: 'shopify_deployment',
          agentType: 'shopify_deployment',
          action: 'deploy_store',
          input: { storeId: input.storeId },
          dependsOn: ['shopify_store_creation', 'color_scheme', 'product_management'],
        },
      ],
    }

    const workflow = workflows[workflowName]
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`)
    }

    // Execute workflow steps in order, respecting dependencies
    const results: WorkflowResult['steps'] = []
    const stepOutputs: Record<string, any> = {}

    for (const step of workflow) {
      // Check dependencies
      if (step.dependsOn) {
        const unmetDeps = step.dependsOn.filter((dep) => !stepOutputs[dep])
        if (unmetDeps.length > 0) {
          results.push({
            stepId: step.agentId,
            agentId: '',
            success: false,
            error: `Unmet dependencies: ${unmetDeps.join(', ')}`,
          })
          continue
        }
      }

      const agents = agentRegistry.getByType(step.agentType as any)
      const agent = agents[0] // Use first available agent of this type

      if (!agent) {
        results.push({
          stepId: step.agentId,
          agentId: '',
          success: false,
          error: `No agent available for type: ${step.agentType}`,
        })
        continue
      }

      const stepInput = {
        ...step.input,
        ...stepOutputs,
      }

      try {
        const output = await agent.execute(stepInput, { userId })
        results.push({
          stepId: step.agentId,
          agentId: agent.getId(),
          success: output.success,
          output: output.data,
          error: output.error,
        })

        if (output.success && output.data) {
          stepOutputs[step.agentId] = output.data
        }
      } catch (error) {
        results.push({
          stepId: step.agentId,
          agentId: agent.getId(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      success: results.every((r) => r.success),
      steps: results,
      finalOutput: stepOutputs,
    }
  }
}

export const orchestrator = new AgentOrchestrator()

