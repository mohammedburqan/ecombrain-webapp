// @ts-ignore - bytez.js may not have TypeScript definitions
import Bytez from 'bytez.js'

// Type definitions for Bytez.js
interface BytezModel {
  run(messages: Array<{ role: string; content: string }>): Promise<{ error?: any; output?: any }>
}

interface BytezSDK {
  model(modelName: string): BytezModel
}

// Initialize Bytez SDK
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY || '89561e05a6630f3b1b45f0ab16fd90fa'
const DEFAULT_MODEL = 'Qwen/Qwen3-0.6B'

let bytezSDK: BytezSDK | null = null

if (BYTEZ_API_KEY) {
  try {
    // @ts-ignore
    bytezSDK = new Bytez(BYTEZ_API_KEY) as BytezSDK
  } catch (error) {
    console.error('Failed to initialize Bytez SDK:', error)
  }
}

export class OpenAIClient {
  private sdk: BytezSDK | null
  private modelName: string

  constructor(modelName: string = DEFAULT_MODEL) {
    this.sdk = bytezSDK
    this.modelName = modelName
  }

  private ensureSDK(): BytezSDK {
    if (!this.sdk) {
      throw new Error('Bytez API key is not configured. Please set BYTEZ_API_KEY environment variable.')
    }
    return this.sdk
  }

  private async runModel(messages: Array<{ role: string; content: string }>): Promise<string> {
    const sdk = this.ensureSDK()
    const model = sdk.model(this.modelName)
    
    const { error, output } = await model.run(messages)
    
    if (error) {
      throw new Error(`Bytez API error: ${error}`)
    }
    
    if (!output) {
      throw new Error('No output received from Bytez API')
    }

    // Handle different output formats
    if (typeof output === 'string') {
      return output
    }
    
    if (Array.isArray(output) && output.length > 0) {
      // If output is an array, get the last message content
      const lastMessage = output[output.length - 1]
      if (typeof lastMessage === 'object' && lastMessage.content) {
        return lastMessage.content
      }
      return String(output[output.length - 1])
    }
    
    if (typeof output === 'object' && output.content) {
      return output.content
    }
    
    return String(output)
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
      // Use custom model if provided
      if (options?.model) {
        const sdk = this.ensureSDK()
        const model = sdk.model(options.model)
        const messages = [
          ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt }
        ]
        const { error, output } = await model.run(messages)
        
        if (error) {
          throw new Error(`Bytez API error: ${error}`)
        }
        
        return this.extractOutput(output)
      }

      const messages = [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ]

      return await this.runModel(messages)
    } catch (error) {
      console.error('Bytez API error:', error)
      throw new Error(`Bytez API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private extractOutput(output: any): string {
    if (typeof output === 'string') {
      return output
    }
    
    if (Array.isArray(output) && output.length > 0) {
      const lastMessage = output[output.length - 1]
      if (typeof lastMessage === 'object' && lastMessage.content) {
        return lastMessage.content
      }
      return String(lastMessage)
    }
    
    if (typeof output === 'object' && output.content) {
      return output.content
    }
    
    return String(output)
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: Record<string, any>,
    options?: { model?: string; temperature?: number }
  ): Promise<T> {
    try {
      // Optimized: Shorter JSON instruction for faster processing
      const jsonPrompt = `${prompt}\n\nJSON only: ${JSON.stringify(schema)}`

      const response = await this.generateText(jsonPrompt, {
        ...options,
        temperature: options?.temperature ?? 0.3, // Default to lower temperature for speed
        maxTokens: 500, // Limit tokens for faster generation
      })
      
      // Try to extract JSON from the response (optimized regex)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as T
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          throw new Error('Failed to parse JSON response from Bytez API')
        }
      }
      
      throw new Error('No valid JSON found in response')
    } catch (error) {
      console.error('Bytez structured output error:', error)
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
    // Optimized shorter prompt for faster generation
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
      { temperature: 0.3 } // Lower temperature for faster, more deterministic responses
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
    // Optimized shorter prompt for faster generation
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
      { temperature: 0.4 } // Lower temperature for faster, more deterministic responses
    )
  }
}

export const openAIClient = new OpenAIClient()
