import { createSupabaseClient } from '@/lib/supabase/server'
import { AgentType } from '@/types/database'

export interface AgentConfig {
  [key: string]: any
}

export interface TaskInput {
  [key: string]: any
}

export interface TaskOutput {
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, any>
}

export abstract class BaseAgent {
  protected id: string
  protected name: string
  protected type: AgentType
  protected config: AgentConfig
  protected status: 'active' | 'inactive'

  constructor(id: string, name: string, type: AgentType, config: AgentConfig = {}) {
    this.id = id
    this.name = name
    this.type = type
    this.config = config
    this.status = 'active'
  }

  abstract execute(input: TaskInput, context?: Record<string, any>): Promise<TaskOutput>

  async log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    metadata?: Record<string, any>,
    taskId?: string
  ): Promise<void> {
    const supabase = createSupabaseClient()
    
    await supabase.from('agent_logs').insert({
      agent_id: this.id,
      task_id: taskId || null,
      log_level: level,
      message,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    })
  }

  async updateMetrics(metricName: string, metricValue: number): Promise<void> {
    const supabase = createSupabaseClient()
    
    await supabase.from('agent_metrics').insert({
      agent_id: this.id,
      metric_name: metricName,
      metric_value: metricValue,
      timestamp: new Date().toISOString(),
    })
  }

  async updateStatus(status: 'active' | 'inactive'): Promise<void> {
    this.status = status
    const supabase = createSupabaseClient()
    
    await supabase
      .from('agents')
      .update({ status })
      .eq('id', this.id)
  }

  getId(): string {
    return this.id
  }

  getName(): string {
    return this.name
  }

  getType(): AgentType {
    return this.type
  }

  getStatus(): 'active' | 'inactive' {
    return this.status
  }

  getConfig(): AgentConfig {
    return this.config
  }

  async updateConfig(config: Partial<AgentConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
    const supabase = createSupabaseClient()
    
    await supabase
      .from('agents')
      .update({ config: this.config })
      .eq('id', this.id)
  }
}

