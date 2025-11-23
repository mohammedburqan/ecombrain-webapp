import '@shopify/shopify-api/adapters/node'
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api'
import { NodeHttpRuntime } from '@shopify/shopify-api/runtime/node'

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: ['read_products', 'write_products', 'read_themes', 'write_themes', 'read_orders', 'write_orders'],
  hostName: process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || 'localhost:3000',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
  httpRuntime: NodeHttpRuntime(),
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

