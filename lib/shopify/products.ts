import { createShopifyRestClient } from './client'
import { createSupabaseClient } from '../supabase/server'

export interface ProductData {
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  tags?: string[]
  variants?: Array<{
    price: string
    sku?: string
    inventory_quantity?: number
  }>
  images?: Array<{
    src: string
    alt?: string
  }>
}

export class ShopifyProductOperations {
  async createProduct(
    storeId: string,
    productData: ProductData
  ): Promise<{ productId: string }> {
    const credentials = await this.getStoreCredentials(storeId)
    if (!credentials) {
      throw new Error('Store not found')
    }

    if (!credentials.accessToken) {
      throw new Error('Store access token not found. Please ensure your Shopify store credentials are configured.')
    }

    const client = createShopifyRestClient(credentials.accessToken, credentials.shopifyDomain)
    
    const response = await client.post({
      path: 'products',
      data: {
        product: productData,
      },
    })

    return {
      productId: response.body.product.id.toString(),
    }
  }

  async bulkCreateProducts(
    storeId: string,
    products: ProductData[]
  ): Promise<Array<{ productId: string; success: boolean; error?: string }>> {
    const results = []

    for (const product of products) {
      try {
        const result = await this.createProduct(storeId, product)
        results.push({ ...result, success: true })
      } catch (error) {
        results.push({
          productId: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  async uploadProductImage(
    storeId: string,
    productId: string,
    imageUrl: string,
    altText?: string
  ): Promise<void> {
    const credentials = await this.getStoreCredentials(storeId)
    if (!credentials) {
      throw new Error('Store not found')
    }

    if (!credentials.accessToken) {
      throw new Error('Store access token not found. Please ensure your Shopify store credentials are configured.')
    }

    const client = createShopifyRestClient(credentials.accessToken, credentials.shopifyDomain)
    
    await client.post({
      path: `products/${productId}/images`,
      data: {
        image: {
          src: imageUrl,
          alt: altText,
        },
      },
    })
  }

  async createCollection(
    storeId: string,
    title: string,
    productIds?: string[]
  ): Promise<{ collectionId: string }> {
    const credentials = await this.getStoreCredentials(storeId)
    if (!credentials) {
      throw new Error('Store not found')
    }

    if (!credentials.accessToken) {
      throw new Error('Store access token not found. Please ensure your Shopify store credentials are configured.')
    }

    const client = createShopifyRestClient(credentials.accessToken, credentials.shopifyDomain)
    
    const response = await client.post({
      path: 'collections',
      data: {
        collection: {
          title,
          collects: productIds?.map((id) => ({ product_id: parseInt(id) })) || [],
        },
      },
    })

    return {
      collectionId: response.body.collection.id.toString(),
    }
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

export const productOperations = new ShopifyProductOperations()

