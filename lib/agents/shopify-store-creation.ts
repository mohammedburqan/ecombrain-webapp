import { BaseAgent, TaskInput, TaskOutput } from './base-agent'
import { AgentType } from '@/types/database'
import { createSupabaseClient } from '../supabase/server'

export class ShopifyStoreCreationAgent extends BaseAgent {
  constructor(id: string, name: string, config: Record<string, any> = {}) {
    super(id, name, 'shopify_store_creation', config)
  }

  async execute(input: TaskInput, context?: Record<string, any>): Promise<TaskOutput> {
    try {
      const storeName = input.storeName || input.name
      const userId = input.userId || context?.userId
      const shopifyDomain = input.shopifyDomain || `${storeName.toLowerCase().replace(/\s+/g, '-')}.myshopify.com`
      const apiKey = input.apiKey
      const apiSecret = input.apiSecret
      const adminApiAccessToken = input.adminApiAccessToken

      if (!storeName || !userId) {
        throw new Error('Store name and user ID are required')
      }

      // Validate API credentials if provided
      if (shopifyDomain && (!apiKey || !apiSecret || !adminApiAccessToken)) {
        throw new Error('Shopify API credentials (API Key, API Secret, and Admin API Access Token) are required when connecting to an existing store')
      }

      await this.log('info', `Creating Shopify store: ${storeName}`, { userId, shopifyDomain })

      // Prepare store config with API credentials
      const storeConfig: Record<string, any> = {
        ...(input.config || {}),
      }

      // Store API credentials securely in store_config
      if (apiKey && apiSecret) {
        storeConfig.apiCredentials = {
          apiKey,
          apiSecret,
          // Note: Admin API Access Token is stored separately as access_token for backward compatibility
        }
      }

      // Create store record in database
      const supabase = await createSupabaseClient()
      const { data: store, error } = await supabase
        .from('shopify_stores')
        .insert({
          user_id: userId,
          store_name: storeName,
          shopify_domain: shopifyDomain,
          access_token: adminApiAccessToken || '', // Store Admin API Access Token as access_token
          status: 'creating',
          store_config: storeConfig,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create store record: ${error.message}`)
      }

      await this.updateMetrics('stores_created', 1)
      await this.log('info', `Store record created: ${store.id}`)

      // Store is now ready with API credentials
      // The credentials can be used to interact with the Shopify store

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
    const supabase = await createSupabaseClient()
    
    await supabase
      .from('shopify_stores')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', storeId)
  }
}

