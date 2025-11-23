import { createShopifyClient } from './client'
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

  private async getStoreAccessToken(storeId: string): Promise<string | null> {
    const supabase = createSupabaseClient()
    
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('id', storeId)
      .single()

    return store?.access_token || null
  }
}

export const productOperations = new ShopifyProductOperations()

