import { geminiClient } from './gemini'

export type AIProvider = 'gemini'

export interface AIUsageMetrics {
  provider: AIProvider
  model: string
  tokensUsed: number
  cost: number
  timestamp: Date
}

export class AIProviderRouter {
  private usageMetrics: AIUsageMetrics[] = []

  async route(
    taskType: string,
    prompt: string,
    options?: {
      provider?: AIProvider
      useStructuredOutput?: boolean
      schema?: Record<string, any>
      temperature?: number
    }
  ): Promise<string | any> {
    const provider = options?.provider || this.selectProvider(taskType)

    try {
      let result: string | any

      // Optimize: Use lower temperature and maxTokens for faster generation
      const optimizedOptions = {
        temperature: options?.temperature ?? 0.3, // Default to lower temperature for speed
        maxTokens: 500, // Limit tokens for faster generation
      }

      if (options?.useStructuredOutput && options?.schema) {
        result = await geminiClient.generateStructuredOutput(
          prompt,
          options.schema,
          { temperature: optimizedOptions.temperature }
        )
      } else {
        result = await geminiClient.generateText(prompt, {
          temperature: optimizedOptions.temperature,
          maxTokens: optimizedOptions.maxTokens,
        })
      }

      // Track usage (simplified - actual token counting would be more complex)
      this.trackUsage(provider, taskType)

      return result
    } catch (error) {
      console.error(`Error with Gemini:`, error)
      throw new Error(
        `Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private selectProvider(taskType: string): AIProvider {
    // Always use Gemini as the default provider
    return 'gemini'
  }

  private trackUsage(provider: AIProvider, taskType: string) {
    // Simplified usage tracking - in production, track actual tokens
    this.usageMetrics.push({
      provider,
      model: 'gemini-2.0-flash-exp',
      tokensUsed: 1000, // Placeholder
      cost: 0.001, // Placeholder
      timestamp: new Date(),
    })
  }

  getUsageMetrics(): AIUsageMetrics[] {
    return this.usageMetrics
  }

  async orchestrateAgents(
    task: string,
    availableAgents: string[],
    context?: Record<string, any>
  ) {
    // Use Gemini for orchestration as it's better for multi-agent coordination
    return geminiClient.orchestrateAgents(task, availableAgents, context)
  }
}

export const aiRouter = new AIProviderRouter()

