import { createSupabaseClient } from '../supabase/server'

export interface WebhookEvent {
  topic: string
  shop: string
  data: any
}

export class ShopifyWebhookHandler {
  async handleWebhook(event: WebhookEvent): Promise<void> {
    const supabase = await createSupabaseClient()

    // Log webhook event
    await supabase.from('analytics_events').insert({
      event_type: `shopify_webhook_${event.topic}`,
      metadata: {
        shop: event.shop,
        topic: event.topic,
        data: event.data,
      },
      timestamp: new Date().toISOString(),
    })

    // Handle specific webhook types
    switch (event.topic) {
      case 'orders/create':
        await this.handleOrderCreated(event.data)
        break
      case 'orders/updated':
        await this.handleOrderUpdated(event.data)
        break
      case 'products/create':
        await this.handleProductCreated(event.data)
        break
      case 'products/update':
        await this.handleProductUpdated(event.data)
        break
      default:
        console.log(`Unhandled webhook topic: ${event.topic}`)
    }
  }

  private async handleOrderCreated(orderData: any): Promise<void> {
    // Handle new order
    console.log('New order created:', orderData.id)
  }

  private async handleOrderUpdated(orderData: any): Promise<void> {
    // Handle order update
    console.log('Order updated:', orderData.id)
  }

  private async handleProductCreated(productData: any): Promise<void> {
    // Handle new product
    console.log('New product created:', productData.id)
  }

  private async handleProductUpdated(productData: any): Promise<void> {
    // Handle product update
    console.log('Product updated:', productData.id)
  }
}

export const webhookHandler = new ShopifyWebhookHandler()

