import '@shopify/shopify-api/adapters/node'
import { shopifyApi, ApiVersion } from '@shopify/shopify-api'

// Shopify Admin API version
const API_VERSION = '2025-01'

// Lazy initialization of Shopify SDK (only for OAuth/webhook validation)
let shopifyInstance: ReturnType<typeof shopifyApi> | null = null

function getShopifySDK(apiKey?: string, apiSecret?: string) {
  // Only initialize if we have credentials and haven't initialized yet
  if (!shopifyInstance && apiKey && apiSecret) {
    shopifyInstance = shopifyApi({
      apiKey,
      apiSecretKey: apiSecret,
      scopes: ['read_products', 'write_products', 'read_themes', 'write_themes', 'read_orders', 'write_orders'],
      hostName: process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || 'localhost:3000',
      apiVersion: ApiVersion.January25,
      isEmbeddedApp: false,
    })
  }
  return shopifyInstance
}

/**
 * Creates a REST client for Shopify Admin API using direct HTTP calls
 * This doesn't require SDK initialization and works with just an access token
 */
export interface ShopifyRestClient {
  get: (options: { path: string; query?: Record<string, any> }) => Promise<{ body: any; status: number }>
  post: (options: { path: string; data?: any }) => Promise<{ body: any; status: number }>
  put: (options: { path: string; data?: any }) => Promise<{ body: any; status: number }>
  delete: (options: { path: string }) => Promise<{ body: any; status: number }>
}

export function createShopifyRestClient(accessToken: string, shop: string): ShopifyRestClient {
  if (!accessToken) {
    throw new Error('Access token is required')
  }
  if (!shop) {
    throw new Error('Shop domain is required')
  }

  // Normalize shop domain (remove https:// if present, ensure .myshopify.com)
  const normalizedShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const baseUrl = `https://${normalizedShop}/admin/api/${API_VERSION}`

  const headers = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  }

  return {
    async get({ path, query }: { path: string; query?: Record<string, any> }) {
      const url = new URL(`${baseUrl}/${path}.json`)
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      return {
        body: await response.json(),
        status: response.status,
      }
    },

    async post({ path, data }: { path: string; data?: any }) {
      const url = `${baseUrl}/${path}.json`
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      return {
        body: await response.json(),
        status: response.status,
      }
    },

    async put({ path, data }: { path: string; data?: any }) {
      const url = `${baseUrl}/${path}.json`
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      return {
        body: await response.json(),
        status: response.status,
      }
    },

    async delete({ path }: { path: string }) {
      const url = `${baseUrl}/${path}.json`
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      // DELETE might return empty body
      let body = {}
      const text = await response.text()
      if (text) {
        try {
          body = JSON.parse(text)
        } catch {
          // Ignore parse errors for empty responses
        }
      }

      return {
        body,
        status: response.status,
      }
    },
  }
}

/**
 * Legacy function for backward compatibility
 * Now uses the REST client instead of SDK
 */
export function createShopifyClient(accessToken: string, shop: string): ShopifyRestClient {
  return createShopifyRestClient(accessToken, shop)
}

/**
 * Get Shopify OAuth URL (requires API key/secret)
 * Only use this if you need OAuth flow
 */
export function getShopifyOAuthUrl(
  shop: string,
  redirectUri: string,
  apiKey: string,
  apiSecret: string
): string {
  const shopify = getShopifySDK(apiKey, apiSecret)
  if (!shopify) {
    throw new Error('Shopify SDK not initialized. API key and secret are required for OAuth.')
  }
  
  const authRoute = shopify.auth.buildAuthURL({
    shop,
    redirectUri,
    isOnline: false,
  })
  return authRoute
}

/**
 * Validate Shopify webhook request (requires API secret)
 * Only use this if you need webhook validation
 */
export async function validateShopifyRequest(
  query: Record<string, string>,
  rawBody: string,
  apiSecret: string
): Promise<boolean> {
  try {
    const shopify = getShopifySDK('', apiSecret) // API key not needed for validation
    if (!shopify) {
      return false
    }
    return await shopify.auth.validateAuthCallback(query as any, rawBody)
  } catch {
    return false
  }
}

