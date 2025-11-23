import { createShopifyClient } from './client'
import { createSupabaseClient } from '../supabase/server'

export interface StoreConfig {
  name: string
  domain: string
  email?: string
  currency?: string
  timezone?: string
}

export class ShopifyStoreOperations {
  async createStore(userId: string, config: StoreConfig): Promise<{
    storeId: string
    domain: string
    status: string
  }> {
    // In production, this would use Shopify Partner API to create a development store
    // For now, we'll create a record in our database
    
    const supabase = createSupabaseClient()
    
    const { data: store, error } = await supabase
      .from('shopify_stores')
      .insert({
        user_id: userId,
        store_name: config.name,
        shopify_domain: config.domain,
        access_token: '', // Will be set after OAuth
        status: 'creating',
        store_config: config,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create store: ${error.message}`)
    }

    return {
      storeId: store.id,
      domain: store.shopify_domain,
      status: store.status,
    }
  }

  async getStoreAccessToken(storeId: string): Promise<string | null> {
    const supabase = createSupabaseClient()
    
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('access_token, shopify_domain')
      .eq('id', storeId)
      .single()

    return store?.access_token || null
  }

  async updateStoreConfig(
    storeId: string,
    config: Partial<StoreConfig>
  ): Promise<void> {
    const supabase = createSupabaseClient()
    
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('store_config')
      .eq('id', storeId)
      .single()

    await supabase
      .from('shopify_stores')
      .update({
        store_config: { ...store?.store_config, ...config },
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId)
  }

  async getStoreSettings(storeId: string): Promise<any> {
    const accessToken = await this.getStoreAccessToken(storeId)
    if (!accessToken) {
      throw new Error('Store access token not found')
    }

    const supabase = createSupabaseClient()
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('shopify_domain')
      .eq('id', storeId)
      .single()

    if (!store) {
      throw new Error('Store not found')
    }

    const client = createShopifyClient(accessToken, store.shopify_domain)
    const response = await client.get({ path: 'shop' })

    return response.body
  }
}

export const storeOperations = new ShopifyStoreOperations()

