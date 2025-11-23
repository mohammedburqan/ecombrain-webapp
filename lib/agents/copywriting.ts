import { BaseAgent, TaskInput, TaskOutput } from './base-agent'
import { AgentType } from '@/types/database'
import { aiRouter } from '../ai/router'

export class CopywritingAgent extends BaseAgent {
  constructor(id: string, name: string, config: Record<string, any> = {}) {
    super(id, name, 'copywriting', config)
  }

  async execute(input: TaskInput, context?: Record<string, any>): Promise<TaskOutput> {
    try {
      const contentType = input.contentType || 'product_description'
      const product = input.product || context?.product
      const niche = input.niche || context?.niche

      await this.log('info', `Generating ${contentType}`, { product, niche })

      switch (contentType) {
        case 'product_description':
          return await this.generateProductDescription(product, niche)
        case 'ad_copy':
          return await this.generateAdCopy(input.product, input.platform)
        case 'email':
          return await this.generateEmail(input.emailType, input.context)
        default:
          throw new Error(`Unknown content type: ${contentType}`)
      }
    } catch (error) {
      await this.log('error', `Copywriting failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  private async generateProductDescription(product: any, niche?: string): Promise<TaskOutput> {
    const prompt = `Write compelling product description for: ${product?.name || 'product'}
${niche ? `Target niche: ${niche}` : ''}
${product?.features ? `Key features: ${product.features.join(', ')}` : ''}

Make it persuasive, SEO-friendly, and highlight benefits.`

    const description = await aiRouter.route('copywriting', prompt, {
      provider: 'gemini',
      temperature: 0.7,
    })

    await this.updateMetrics('copy_generated', 1)

    return {
      success: true,
      data: { description },
    }
  }

  private async generateAdCopy(product: any, platform?: string): Promise<TaskOutput> {
    const prompt = `Create ad copy for: ${product?.name || 'product'}
${platform ? `Platform: ${platform}` : ''}
Make it attention-grabbing and conversion-focused.`

    const adCopy = await aiRouter.route('ad_copywriting', prompt, {
      provider: 'gemini',
      temperature: 0.8,
    })

    return {
      success: true,
      data: { adCopy },
    }
  }

  private async generateEmail(emailType: string, context?: any): Promise<TaskOutput> {
    const prompt = `Write a ${emailType} email${context ? ` with context: ${JSON.stringify(context)}` : ''}.`

    const email = await aiRouter.route('email_copywriting', prompt, {
      provider: 'gemini',
    })

    return {
      success: true,
      data: { email },
    }
  }
}

