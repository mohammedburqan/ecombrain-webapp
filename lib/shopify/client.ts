import '@shopify/shopify-api/adapters/node'
import { shopifyApi, ApiVersion } from '@shopify/shopify-api'

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: ['read_products', 'write_products', 'read_themes', 'write_themes', 'read_orders', 'write_orders'],
  hostName: process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || 'localhost:3000',
  apiVersion: ApiVersion.January25,
  isEmbeddedApp: false,
})

export function createShopifyClient(accessToken: string, shop: string) {
  return new shopify.clients.Rest({ session: { shop, accessToken } as any })
}

export function getShopifyOAuthUrl(shop: string, redirectUri: string): string {
  const authRoute = shopify.auth.buildAuthURL({
    shop,
    redirectUri,
    isOnline: false,
  })
  return authRoute
}

export async function validateShopifyRequest(
  query: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  try {
    return await shopify.auth.validateAuthCallback(query as any, rawBody)
  } catch {
    return false
  }
}

export { shopify }

