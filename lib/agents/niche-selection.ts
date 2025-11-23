import { BaseAgent, TaskInput, TaskOutput } from './base-agent'
import { openAIClient } from '../ai/openai'
import { aiRouter } from '../ai/router'
import { AgentType } from '@/types/database'

export class NicheSelectionAgent extends BaseAgent {
  constructor(id: string, name: string, config: Record<string, any> = {}) {
    super(id, name, 'niche_selection', config)
  }

  async execute(input: TaskInput, context?: Record<string, any>): Promise<TaskOutput> {
    try {
      await this.log('info', `Starting niche analysis for: ${input.nicheDescription || 'general market'}`)

      const nicheDescription = input.nicheDescription || input.query || 'e-commerce opportunities'

      // Use OpenAI for structured niche analysis
      const analysis = await openAIClient.analyzeNiche(nicheDescription)

      await this.updateMetrics('niches_analyzed', 1)
      await this.updateMetrics('market_opportunity_avg', analysis.market_opportunity)
      await this.updateMetrics('competition_level_avg', analysis.competition_level)

      await this.log('info', `Niche analysis completed: ${analysis.niche_name}`, {
        opportunity_score: analysis.market_opportunity,
        competition_score: analysis.competition_level,
      })

      return {
        success: true,
        data: {
          niche: analysis.niche_name,
          marketOpportunity: analysis.market_opportunity,
          competitionLevel: analysis.competition_level,
          recommendedColors: analysis.recommended_colors,
          targetAudience: analysis.target_audience,
          keyProducts: analysis.key_products,
        },
        metadata: {
          agent: this.name,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      await this.log('error', `Niche selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async recommendMultipleNiches(count: number = 5): Promise<TaskOutput> {
    try {
      // Optimized shorter prompt for faster batch generation
      const prompt = `Generate ${count} e-commerce niches. Each: {niche_name, market_opportunity:1-10, competition_level:1-10, recommended_colors:[hex], target_audience, key_products:[...]}`

      const niches = await aiRouter.route(
        'niche_analysis',
        prompt,
        {
          provider: 'openai',
          useStructuredOutput: true,
          schema: {
            niches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  niche_name: { type: 'string' },
                  market_opportunity: { type: 'number' },
                  competition_level: { type: 'number' },
                  recommended_colors: { type: 'array', items: { type: 'string' } },
                  target_audience: { type: 'string' },
                  key_products: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        }
      )

      return {
        success: true,
        data: niches,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate niche recommendations',
      }
    }
  }
}

