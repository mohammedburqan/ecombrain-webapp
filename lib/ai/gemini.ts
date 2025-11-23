import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAN04TOLMmZbAUF8cH-Ba_YNjMaiWGZgow'
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

export class GeminiClient {
  private model: any

  constructor(modelName: string = 'gemini-2.0-flash-exp') {
    this.model = genAI.getGenerativeModel({ model: modelName })
  }

  async generateText(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
    systemInstruction?: string
  }) {
    try {
      const generationConfig = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
      }

      const systemInstruction = options?.systemInstruction

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      })

      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: Record<string, any>,
    options?: { temperature?: number }
  ): Promise<T> {
    try {
      const structuredPrompt = `${prompt}\n\nReturn the response as valid JSON matching this schema: ${JSON.stringify(schema)}`
      const response = await this.generateText(structuredPrompt, options)
      
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T
      }
      
      throw new Error('Failed to parse structured output from Gemini')
    } catch (error) {
      console.error('Gemini structured output error:', error)
      throw error
    }
  }

  async orchestrateAgents(
    task: string,
    availableAgents: string[],
    context?: Record<string, any>
  ): Promise<{
    selectedAgents: string[]
    workflow: Array<{ agent: string; action: string; input: any }>
  }> {
    const orchestrationPrompt = `
You are an AI orchestrator managing multiple specialized agents for an e-commerce platform.

Available agents: ${availableAgents.join(', ')}

Task: ${task}
${context ? `Context: ${JSON.stringify(context)}` : ''}

Determine which agents should be used and in what order to complete this task.
Return a JSON object with:
- selectedAgents: array of agent names to use
- workflow: array of steps, each with agent name, action, and input data
`

    return this.generateStructuredOutput(
      orchestrationPrompt,
      {
        selectedAgents: ['string'],
        workflow: [
          {
            agent: 'string',
            action: 'string',
            input: 'object',
          },
        ],
      },
      { temperature: 0.3 }
    )
  }

  async analyzeNiche(nicheDescription: string): Promise<{
    niche_name: string
    market_opportunity: number
    competition_level: number
    recommended_colors: string[]
    target_audience: string
    key_products: string[]
  }> {
    const prompt = `E-commerce niche: ${nicheDescription}
Return JSON: {niche_name, market_opportunity:1-10, competition_level:1-10, recommended_colors:[hex], target_audience, key_products:[...]}`

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
      { temperature: 0.3 }
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
    const prompt = `Niche: ${niche}${brandPersonality ? ` | Personality: ${brandPersonality}` : ''}
Return JSON: {primary_color:hex, secondary_color:hex, accent_colors:[hex], rationale:brief}`

    return this.generateStructuredOutput(
      prompt,
      {
        primary_color: { type: 'string' },
        secondary_color: { type: 'string' },
        accent_colors: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
      },
      { temperature: 0.4 }
    )
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      // Use Gemini's image generation capabilities
      // Note: Gemini 2.0 Flash supports image generation through the Imagen API
      // For now, we'll use a text-to-image approach or fallback to a placeholder
      
      // Try using Gemini's multimodal capabilities if available
      // This is a placeholder implementation - in production, you'd use Google's Imagen API
      // or another image generation service
      
      // For now, return a placeholder URL that can be replaced with actual image generation
      // In a real implementation, you would call an image generation API here
      
      // Using a placeholder service - replace with actual image generation API
      // Example: Using a service like Imagen, DALL-E, or Stable Diffusion
      
      // Placeholder: Return a data URL or use an image generation service
      // For production, integrate with Google Imagen API or another service
      throw new Error('Image generation not yet implemented - please integrate with an image generation API')
    } catch (error) {
      console.error('Image generation error:', error)
      // Fallback: Return a placeholder or throw
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const geminiClient = new GeminiClient()

