import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class OpenAIClient {
  private client: OpenAI

  constructor() {
    this.client = openai
  }

  async generateText(
    prompt: string,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
      systemPrompt?: string
    }
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4',
        messages: [
          ...(options?.systemPrompt
            ? [{ role: 'system' as const, content: options.systemPrompt }]
            : []),
          { role: 'user' as const, content: prompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })

      return response.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: Record<string, any>,
    options?: { model?: string; temperature?: number }
  ): Promise<T> {
    try {
      const response = await this.client.beta.chat.completions.parse({
        model: options?.model || 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: {
              type: 'object',
              properties: schema,
              required: Object.keys(schema),
            },
            strict: true,
          },
        },
        temperature: options?.temperature ?? 0.3,
      })

      const parsed = response.choices[0]?.message?.parsed
      if (!parsed) {
        throw new Error('Failed to parse structured output from OpenAI')
      }

      return parsed as T
    } catch (error) {
      // Fallback to regular generation with JSON parsing
      try {
        const jsonPrompt = `${prompt}\n\nReturn the response as valid JSON matching this schema: ${JSON.stringify(schema)}`
        const response = await this.generateText(jsonPrompt, options)
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as T
        }
      } catch (fallbackError) {
        console.error('OpenAI structured output fallback error:', fallbackError)
      }
      throw error
    }
  }

  async analyzeNiche(nicheDescription: string): Promise<{
    niche_name: string
    market_opportunity: number
    competition_level: number
    recommended_colors: string[]
    target_audience: string
    key_products: string[]
  }> {
    const prompt = `Analyze this e-commerce niche and provide insights:
Niche: ${nicheDescription}

Provide:
- niche_name: A concise name for this niche
- market_opportunity: Score from 1-10
- competition_level: Score from 1-10 (1 = low competition)
- recommended_colors: Array of 3-5 hex color codes that fit this niche
- target_audience: Description of the target customer
- key_products: Array of 5-10 product types that would sell well in this niche`

    return this.generateStructuredOutput(
      prompt,
      {
        niche_name: { type: 'string' },
        market_opportunity: { type: 'number' },
        competition_level: { type: 'number' },
        recommended_colors: { type: 'array', items: { type: 'string' } },
        target_audience: { type: 'string' },
        key_products: { type: 'array', items: { type: 'string' } },
      },
      { temperature: 0.5 }
    )
  }

  async recommendColorScheme(
    niche: string,
    brandPersonality?: string
  ): Promise<{
    primary_color: string
    secondary_color: string
    accent_colors: string[]
    rationale: string
  }> {
    const prompt = `Recommend a color scheme for an e-commerce store:
Niche: ${niche}
${brandPersonality ? `Brand Personality: ${brandPersonality}` : ''}

Provide:
- primary_color: Main brand color (hex code)
- secondary_color: Secondary brand color (hex code)
- accent_colors: Array of 2-3 accent colors (hex codes)
- rationale: Brief explanation of why these colors work for this niche`

    return this.generateStructuredOutput(
      prompt,
      {
        primary_color: { type: 'string' },
        secondary_color: { type: 'string' },
        accent_colors: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
      },
      { temperature: 0.6 }
    )
  }
}

export const openAIClient = new OpenAIClient()

