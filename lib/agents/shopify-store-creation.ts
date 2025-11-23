import { BaseAgent, TaskInput, TaskOutput } from './base-agent'
import { AgentType } from '@/types/database'
import { createSupabaseServerClient } from '../supabase/server'

export class ShopifyStoreCreationAgent extends BaseAgent {
  constructor(id: string, name: string, config: Record<string, any> = {}) {
    super(id, name, 'shopify_store_creation', config)
  }

  async execute(input: TaskInput, context?: Record<string, any>): Promise<TaskOutput> {
    try {
      const storeName = input.storeName || input.name
      const userId = input.userId || context?.userId

      if (!storeName || !userId) {
        throw new Error('Store name and user ID are required')
      }

      await this.log('info', `Creating Shopify store: ${storeName}`, { userId })

      // Create store record in database
      const supabase = createSupabaseServerClient()
      const { data: store, error } = await supabase
        .from('shopify_stores')
        .insert({
          user_id: userId,
          store_name: storeName,
          shopify_domain: `${storeName.toLowerCase().replace(/\s+/g, '-')}.myshopify.com`,
          access_token: '', // Will be set after OAuth
          status: 'creating',
          store_config: input.config || {},
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create store record: ${error.message}`)
      }

      await this.updateMetrics('stores_created', 1)
      await this.log('info', `Store record created: ${store.id}`)

      // In a real implementation, this would:
      // 1. Create Shopify Partner API store
      // 2. Handle OAuth flow
      // 3. Store access tokens securely
      // 4. Configure initial store settings

      return {
        success: true,
        data: {
          storeId: store.id,
          storeName: store.store_name,
          domain: store.shopify_domain,
          status: store.status,
        },
        metadata: {
          agent: this.name,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      await this.log('error', `Store creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async updateStoreStatus(storeId: string, status: 'creating' | 'active' | 'suspended'): Promise<void> {
    const supabase = createSupabaseServerClient()
    
    await supabase
      .from('shopify_stores')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', storeId)
  }
}

