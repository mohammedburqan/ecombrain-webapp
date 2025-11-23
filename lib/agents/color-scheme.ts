import { BaseAgent, TaskInput, TaskOutput } from './base-agent'
import { openAIClient } from '../ai/openai'
import { AgentType } from '@/types/database'

export class ColorSchemeAgent extends BaseAgent {
  constructor(id: string, name: string, config: Record<string, any> = {}) {
    super(id, name, 'color_scheme', config)
  }

  async execute(input: TaskInput, context?: Record<string, any>): Promise<TaskOutput> {
    try {
      const niche = input.niche || input.nicheName
      const brandPersonality = input.brandPersonality || input.personality

      if (!niche) {
        throw new Error('Niche is required for color scheme recommendation')
      }

      await this.log('info', `Generating color scheme for niche: ${niche}`)

      const colorScheme = await openAIClient.recommendColorScheme(niche, brandPersonality)

      await this.updateMetrics('color_schemes_generated', 1)
      await this.log('info', `Color scheme generated: ${colorScheme.primary_color}`, {
        primary: colorScheme.primary_color,
        secondary: colorScheme.secondary_color,
        accents: colorScheme.accent_colors,
      })

      return {
        success: true,
        data: {
          primaryColor: colorScheme.primary_color,
          secondaryColor: colorScheme.secondary_color,
          accentColors: colorScheme.accent_colors,
          rationale: colorScheme.rationale,
        },
        metadata: {
          agent: this.name,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      await this.log('error', `Color scheme generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async generateMultipleSchemes(niche: string, count: number = 3): Promise<TaskOutput> {
    try {
      const schemes = []
      
      for (let i = 0; i < count; i++) {
        const scheme = await openAIClient.recommendColorScheme(niche)
        schemes.push(scheme)
      }

      return {
        success: true,
        data: { schemes },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate multiple color schemes',
      }
    }
  }
}

