import { BaseAgent, TaskInput } from './base-agent'
import { agentRegistry } from './registry'
import { createSupabaseClient } from '../supabase/server'

export interface QueuedTask {
  id: string
  agentId: string
  userId: string
  input: TaskInput
  priority: number
  scheduledFor?: Date
}

export class TaskQueue {
  private queue: QueuedTask[] = []
  private processing: Set<string> = new Set()

  async enqueue(
    agentId: string,
    userId: string,
    input: TaskInput,
    priority: number = 0,
    scheduledFor?: Date
  ): Promise<string> {
    const supabase = createSupabaseClient()
    
    const { data: task } = await supabase
      .from('agent_tasks')
      .insert({
        agent_id: agentId,
        user_id: userId,
        task_type: input.action || 'execute',
        input_data: input,
        status: 'pending',
      })
      .select()
      .single()

    const queuedTask: QueuedTask = {
      id: task!.id,
      agentId,
      userId,
      input,
      priority,
      scheduledFor,
    }

    this.queue.push(queuedTask)
    this.queue.sort((a, b) => b.priority - a.priority) // Higher priority first

    return task!.id
  }

  async processNext(): Promise<boolean> {
    if (this.queue.length === 0) {
      return false
    }

    const task = this.queue.shift()!
    
    if (this.processing.has(task.id)) {
      return false
    }

    // Check if task is scheduled for future
    if (task.scheduledFor && task.scheduledFor > new Date()) {
      this.queue.push(task) // Re-add to queue
      return false
    }

    this.processing.add(task.id)

    try {
      const agent = agentRegistry.get(task.agentId)
      if (!agent) {
        throw new Error(`Agent ${task.agentId} not found`)
      }

      const supabase = createSupabaseClient()
      await supabase
        .from('agent_tasks')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      const output = await agent.execute(task.input, {
        userId: task.userId,
        taskId: task.id,
      })

      await supabase
        .from('agent_tasks')
        .update({
          status: output.success ? 'completed' : 'failed',
          output_data: output,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id)
    } catch (error) {
      const supabase = createSupabaseClient()
      await supabase
        .from('agent_tasks')
        .update({
          status: 'failed',
          output_data: { error: error instanceof Error ? error.message : 'Unknown error' },
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id)
    } finally {
      this.processing.delete(task.id)
    }

    return true
  }

  async startProcessor(intervalMs: number = 1000) {
    setInterval(async () => {
      await this.processNext()
    }, intervalMs)
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getProcessingCount(): number {
    return this.processing.size
  }
}

export const taskQueue = new TaskQueue()

