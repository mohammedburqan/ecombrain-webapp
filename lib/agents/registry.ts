import { BaseAgent } from './base-agent'
import { AgentType } from '@/types/database'

export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map()

  register(agent: BaseAgent): void {
    this.agents.set(agent.getId(), agent)
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId)
  }

  get(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId)
  }

  getByType(type: AgentType): BaseAgent[] {
    return Array.from(this.agents.values()).filter((agent) => agent.getType() === type)
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values())
  }

  getActive(): BaseAgent[] {
    return Array.from(this.agents.values()).filter((agent) => agent.getStatus() === 'active')
  }

  async loadFromDatabase(): Promise<void> {
    const { createSupabaseClient } = await import('../supabase/server')
    const supabase = await createSupabaseClient()
    
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('status', 'active')

    if (error) {
      console.error('Error loading agents from database:', error)
      return
    }

    // Agents will be instantiated by their specific classes
    // This is a placeholder - actual loading would instantiate the correct agent class
    console.log(`Loaded ${agents?.length || 0} agents from database`)
  }
}

export const agentRegistry = new AgentRegistry()

