import { createShopifyRestClient } from './client'
import { createSupabaseClient } from '../supabase/server'

export interface StoreConfig {
  name: string
  domain: string
  email?: string
  currency?: string
  timezone?: string
}

export interface StoreCredentials {
  accessToken: string
  shopifyDomain: string
  apiKey?: string
  apiSecret?: string
}

export class ShopifyStoreOperations {
  async createStore(userId: string, config: StoreConfig): Promise<{
    storeId: string
    domain: string
    status: string
  }> {
    // In production, this would use Shopify Partner API to create a development store
    // For now, we'll create a record in our database
    
    const supabase = await createSupabaseClient()
    
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

  /**
   * Get store access token from database
   */
  async getStoreAccessToken(storeId: string): Promise<string | null> {
    const supabase = await createSupabaseClient()
    
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('id', storeId)
      .single()

    return store?.access_token || null
  }

  /**
   * Get all store credentials including API key/secret from store_config
   */
  async getStoreCredentials(storeId: string): Promise<StoreCredentials | null> {
    const supabase = await createSupabaseClient()
    
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('access_token, shopify_domain, store_config')
      .eq('id', storeId)
      .single()

    if (!store) {
      return null
    }

    const storeConfig = (store.store_config as any) || {}
    const apiCredentials = storeConfig.apiCredentials || {}

    return {
      accessToken: store.access_token || '',
      shopifyDomain: store.shopify_domain,
      apiKey: apiCredentials.apiKey,
      apiSecret: apiCredentials.apiSecret,
    }
  }

  async updateStoreConfig(
    storeId: string,
    config: Partial<StoreConfig>
  ): Promise<void> {
    const supabase = await createSupabaseClient()
    
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
    const credentials = await this.getStoreCredentials(storeId)
    if (!credentials) {
      throw new Error('Store not found')
    }

    if (!credentials.accessToken) {
      throw new Error('Store access token not found')
    }

    const client = createShopifyRestClient(credentials.accessToken, credentials.shopifyDomain)
    const response = await client.get({ path: 'shop' })

    return response.body
  }
}

export const storeOperations = new ShopifyStoreOperations()

