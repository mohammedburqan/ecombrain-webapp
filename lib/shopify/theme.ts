import { createShopifyClient } from './client'
import { createSupabaseServerClient } from '../supabase/server'

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
    const accessToken = await this.getStoreAccessToken(storeId)
    if (!accessToken) {
      throw new Error('Store access token not found')
    }

    const supabase = createSupabaseServerClient()
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('shopify_domain')
      .eq('id', storeId)
      .single()

    if (!store) {
      throw new Error('Store not found')
    }

    const client = createShopifyClient(accessToken, store.shopify_domain)
    
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
    const accessToken = await this.getStoreAccessToken(storeId)
    if (!accessToken) {
      throw new Error('Store access token not found')
    }

    const supabase = createSupabaseServerClient()
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('shopify_domain')
      .eq('id', storeId)
      .single()

    if (!store) {
      throw new Error('Store not found')
    }

    const client = createShopifyClient(accessToken, store.shopify_domain)
    
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

  private async getStoreAccessToken(storeId: string): Promise<string | null> {
    const supabase = createSupabaseServerClient()
    
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('id', storeId)
      .single()

    return store?.access_token || null
  }
}

export const themeOperations = new ShopifyThemeOperations()

