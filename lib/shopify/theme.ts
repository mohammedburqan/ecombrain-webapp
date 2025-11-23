import { createShopifyRestClient } from './client'
import { createSupabaseClient } from '../supabase/server'

export interface ColorScheme {
  primaryColor: string
  secondaryColor: string
  accentColors: string[]
}

export class ShopifyThemeOperations {
  async applyColorScheme(
    storeId: string,
    colorScheme: ColorScheme
  ): Promise<void> {
    const credentials = await this.getStoreCredentials(storeId)
    if (!credentials) {
      throw new Error('Store not found')
    }

    if (!credentials.accessToken) {
      throw new Error('Store access token not found. Please ensure your Shopify store credentials are configured.')
    }

    const client = createShopifyRestClient(credentials.accessToken, credentials.shopifyDomain)
    
    // Get active theme
    const themesResponse = await client.get({ path: 'themes' })
    const activeTheme = themesResponse.body.themes.find((t: any) => t.role === 'main')
    
    if (!activeTheme) {
      throw new Error('No active theme found')
    }

    // Update theme settings with color scheme
    // This would typically involve updating theme.liquid or settings_schema.json
    // For now, we'll update the theme's settings
    const settings = {
      colors: {
        primary: colorScheme.primaryColor,
        secondary: colorScheme.secondaryColor,
        accent: colorScheme.accentColors[0] || colorScheme.primaryColor,
      },
    }

    await client.put({
      path: `themes/${activeTheme.id}/assets`,
      data: {
        asset: {
          key: 'config/settings_schema.json',
          value: JSON.stringify(settings),
        },
      },
    })
  }

  async customizeThemeSettings(
    storeId: string,
    settings: Record<string, any>
  ): Promise<void> {
    const credentials = await this.getStoreCredentials(storeId)
    if (!credentials) {
      throw new Error('Store not found')
    }

    if (!credentials.accessToken) {
      throw new Error('Store access token not found. Please ensure your Shopify store credentials are configured.')
    }

    const client = createShopifyRestClient(credentials.accessToken, credentials.shopifyDomain)
    
    const themesResponse = await client.get({ path: 'themes' })
    const activeTheme = themesResponse.body.themes.find((t: any) => t.role === 'main')
    
    if (!activeTheme) {
      throw new Error('No active theme found')
    }

    // Update theme settings
    await client.put({
      path: `themes/${activeTheme.id}`,
      data: {
        theme: {
          ...settings,
        },
      },
    })
  }

  async deployThemeChanges(storeId: string): Promise<void> {
    // In production, this would publish theme changes
    // For now, we'll just log the action
    console.log(`Deploying theme changes for store ${storeId}`)
  }

  /**
   * Get store access token (legacy method for backward compatibility)
   */
  private async getStoreAccessToken(storeId: string): Promise<string | null> {
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
  private async getStoreCredentials(storeId: string): Promise<{
    accessToken: string
    shopifyDomain: string
    apiKey?: string
    apiSecret?: string
  } | null> {
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
}

export const themeOperations = new ShopifyThemeOperations()

