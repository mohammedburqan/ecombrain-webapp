import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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
}

export const geminiClient = new GeminiClient()

