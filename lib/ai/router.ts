import { geminiClient } from './gemini'
import { openAIClient } from './openai'

export type AIProvider = 'gemini' | 'openai'

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
        if (provider === 'gemini') {
          result = await geminiClient.generateStructuredOutput(
            prompt,
            options.schema,
            { temperature: optimizedOptions.temperature }
          )
        } else {
          result = await openAIClient.generateStructuredOutput(
            prompt,
            options.schema,
            { temperature: optimizedOptions.temperature }
          )
        }
      } else {
        if (provider === 'gemini') {
          result = await geminiClient.generateText(prompt, {
            temperature: optimizedOptions.temperature,
            maxTokens: optimizedOptions.maxTokens,
          })
        } else {
          result = await openAIClient.generateText(prompt, {
            temperature: optimizedOptions.temperature,
            maxTokens: optimizedOptions.maxTokens,
          })
        }
      }

      // Track usage (simplified - actual token counting would be more complex)
      this.trackUsage(provider, taskType)

      return result
    } catch (error) {
      console.error(`Error with ${provider}, trying fallback...`, error)
      
      // Fallback to the other provider
      const fallbackProvider = provider === 'gemini' ? 'openai' : 'gemini'
      
      try {
        if (options?.useStructuredOutput && options?.schema) {
          if (fallbackProvider === 'gemini') {
            return await geminiClient.generateStructuredOutput(
              prompt,
              options.schema,
              { temperature: options.temperature }
            )
          } else {
            return await openAIClient.generateStructuredOutput(
              prompt,
              options.schema,
              { temperature: options.temperature }
            )
          }
        } else {
          if (fallbackProvider === 'gemini') {
            return await geminiClient.generateText(prompt, {
              temperature: options?.temperature,
            })
          } else {
            return await openAIClient.generateText(prompt, {
              temperature: options?.temperature,
            })
          }
        }
      } catch (fallbackError) {
        throw new Error(
          `Both AI providers failed. Original: ${error instanceof Error ? error.message : 'Unknown'}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`
        )
      }
    }
  }

  private selectProvider(taskType: string): AIProvider {
    // Route specific tasks to preferred providers
    const geminiPreferredTasks = [
      'orchestration',
      'multi_agent_coordination',
      'workflow_planning',
    ]

    const openAIPreferredTasks = [
      'niche_analysis',
      'color_recommendation',
      'copywriting',
      'structured_analysis',
    ]

    if (geminiPreferredTasks.some((task) => taskType.includes(task))) {
      return 'gemini'
    }

    if (openAIPreferredTasks.some((task) => taskType.includes(task))) {
      return 'openai'
    }

    // Default to Gemini for orchestration, OpenAI for structured tasks
    return 'openai'
  }

  private trackUsage(provider: AIProvider, taskType: string) {
    // Simplified usage tracking - in production, track actual tokens
    this.usageMetrics.push({
      provider,
      model: provider === 'gemini' ? 'gemini-2.0-flash-exp' : 'gpt-4',
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

