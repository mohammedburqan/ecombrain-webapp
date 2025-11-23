import { orchestrator } from '../agents/orchestrator'
import { NicheSelectionAgent } from '../agents/niche-selection'
import { ColorSchemeAgent } from '../agents/color-scheme'
import { ProductManagementAgent } from '../agents/product-management'
import { ShopifyStoreCreationAgent } from '../agents/shopify-store-creation'
import { ShopifyDeploymentAgent } from '../agents/shopify-deployment'
import { createSupabaseClient } from '../supabase/server'
import { themeOperations } from '../shopify/theme'
import { productOperations } from '../shopify/products'
import { loadProductsFromJSON } from '../utils/products'
import { generateProductImage } from '../utils/image-generation'

export interface StoreCreationInput {
  userId: string
  nicheDescription?: string
  storeName: string
  selectedNiche?: string
  selectedColorScheme?: {
    primaryColor: string
    secondaryColor: string
    accentColors: string[]
  }
  products?: any[]
  shopifyDomain?: string
  apiKey?: string
  apiSecret?: string
  adminApiAccessToken?: string
}

export interface StoreCreationProgress {
  step: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  message?: string
}

export class StoreCreationWorkflow {
  async execute(input: StoreCreationInput): Promise<{
    success: boolean
    storeId?: string
    jobId: string
    progress: StoreCreationProgress[]
  }> {
    const supabase = await createSupabaseClient()

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('store_creation_jobs')
      .insert({
        user_id: input.userId,
        deployment_status: 'pending',
        niche_data: input.selectedNiche ? { niche: input.selectedNiche } : null,
        color_scheme: input.selectedColorScheme || null,
        products_data: input.products || null,
      })
      .select()
      .single()

    // Check for errors in job creation
    if (jobError || !job) {
      throw new Error(`Failed to create store creation job: ${jobError?.message || 'Unknown error'}`)
    }

    const progress: StoreCreationProgress[] = []

    try {
      // Step 1: Niche Selection (if not provided)
      let nicheData = input.selectedNiche
      if (!nicheData && input.nicheDescription) {
        progress.push({
          step: 'niche_selection',
          status: 'running',
          progress: 10,
          message: 'Analyzing niche opportunities...',
        })

        const nicheAgent = new NicheSelectionAgent('temp-niche', 'Niche Selection Agent')
        const nicheResult = await nicheAgent.execute({
          nicheDescription: input.nicheDescription,
        })

        if (!nicheResult.success) {
          throw new Error(`Niche selection failed: ${nicheResult.error}`)
        }

        nicheData = nicheResult.data?.niche
        progress.push({
          step: 'niche_selection',
          status: 'completed',
          progress: 20,
          message: `Selected niche: ${nicheData}`,
        })
      } else {
        progress.push({
          step: 'niche_selection',
          status: 'completed',
          progress: 20,
          message: `Using provided niche: ${nicheData}`,
        })
      }

      // Step 2: Color Scheme Selection (if not provided)
      let colorScheme = input.selectedColorScheme
      if (!colorScheme && nicheData) {
        progress.push({
          step: 'color_scheme',
          status: 'running',
          progress: 30,
          message: 'Generating color scheme...',
        })

        const colorAgent = new ColorSchemeAgent('temp-color', 'Color Scheme Agent')
        const colorResult = await colorAgent.execute({
          niche: nicheData,
        })

        if (!colorResult.success) {
          throw new Error(`Color scheme generation failed: ${colorResult.error}`)
        }

        colorScheme = {
          primaryColor: colorResult.data?.primaryColor,
          secondaryColor: colorResult.data?.secondaryColor,
          accentColors: colorResult.data?.accentColors,
        }

        progress.push({
          step: 'color_scheme',
          status: 'completed',
          progress: 40,
          message: 'Color scheme generated',
        })
      } else {
        progress.push({
          step: 'color_scheme',
          status: 'completed',
          progress: 40,
          message: 'Using provided color scheme',
        })
      }

      // Step 3: Product Discovery/Selection from JSON
      let products = input.products
      if (!products || products.length === 0) {
        progress.push({
          step: 'product_discovery',
          status: 'running',
          progress: 50,
          message: 'Loading products from catalog...',
        })

        // Load products from JSON file based on niche
        if (!nicheData) {
          throw new Error('Niche is required to load products')
        }
        
        const jsonProducts = loadProductsFromJSON(nicheData)
        
        if (!jsonProducts || jsonProducts.length === 0) {
          throw new Error('No products available for this niche.')
        }

        products = jsonProducts
        progress.push({
          step: 'product_discovery',
          status: 'completed',
          progress: 60,
          message: `Loaded ${products.length} products from catalog`,
        })
      } else {
        progress.push({
          step: 'product_discovery',
          status: 'completed',
          progress: 60,
          message: `Using ${products.length} provided products`,
        })
      }

      // Step 4: Create Shopify Store
      progress.push({
        step: 'store_creation',
        status: 'running',
        progress: 70,
        message: 'Creating Shopify store...',
      })

      const storeAgent = new ShopifyStoreCreationAgent('temp-store', 'Store Creation Agent')
      const storeResult = await storeAgent.execute({
        storeName: input.storeName,
        userId: input.userId,
        shopifyDomain: input.shopifyDomain,
        apiKey: input.apiKey,
        apiSecret: input.apiSecret,
        adminApiAccessToken: input.adminApiAccessToken,
      })

      if (!storeResult.success) {
        throw new Error(`Store creation failed: ${storeResult.error}`)
      }

      const storeId = storeResult.data?.storeId
      if (!storeId) {
        throw new Error('Store ID not returned from creation')
      }

      // Update job with store ID
      await supabase
        .from('store_creation_jobs')
        .update({ store_id: storeId })
        .eq('id', job!.id)

      progress.push({
        step: 'store_creation',
        status: 'completed',
        progress: 80,
        message: 'Store created successfully',
      })

      // Step 5: Deploy Store (apply colors, add products, configure theme)
      progress.push({
        step: 'deployment',
        status: 'running',
        progress: 85,
        message: 'Deploying store...',
      })

      // Apply color scheme
      if (colorScheme) {
        await themeOperations.applyColorScheme(storeId, colorScheme)
      }

      // Add products with image generation
      if (products && products.length > 0) {
        progress.push({
          step: 'product_creation',
          status: 'running',
          progress: 90,
          message: `Creating ${products.length} products with images...`,
        })

        // Create products one by one to handle image generation
        for (let i = 0; i < products.length; i++) {
          const product = products[i]
          
          try {
            // Generate image for product
            progress.push({
              step: 'product_creation',
              status: 'running',
              progress: 90 + Math.floor((i / products.length) * 5),
              message: `Generating image for ${product.title || product.product_name || `product ${i + 1}`}...`,
            })

            let imageUrl: string | undefined
            try {
              // Use image_prompt if available, otherwise use product title/description
              const imagePrompt = product.image_prompt || 
                `${product.title || product.product_name || 'product'}, ${product.description || ''}`
              
              imageUrl = await generateProductImage(imagePrompt)
            } catch (imageError) {
              console.error(`Failed to generate image for product ${i + 1}:`, imageError)
              // Continue without image if generation fails
              imageUrl = undefined
            }

            // Prepare product data
            const productData: any = {
              title: product.title || product.product_name || product.name || `Product ${i + 1}`,
              body_html: product.description || '',
              product_type: product.type || '',
              variants: [
                {
                  price: product.price?.replace('$', '') || product.price_range?.split('-')[0]?.replace('$', '') || '19.99',
                },
              ],
            }

            // Add image if generated
            if (imageUrl) {
              productData.images = [
                {
                  src: imageUrl,
                  alt: product.title || product.product_name || product.name,
                },
              ]
            }

            // Create product in Shopify
            const result = await productOperations.createProduct(storeId, productData)
            
            // If image was generated but not included in product creation, upload it separately
            if (imageUrl && result.productId) {
              try {
                await productOperations.uploadProductImage(
                  storeId,
                  result.productId,
                  imageUrl,
                  product.title || product.product_name || product.name
                )
              } catch (uploadError) {
                console.error(`Failed to upload image for product ${result.productId}:`, uploadError)
                // Continue even if image upload fails
              }
            }
          } catch (productError) {
            console.error(`Failed to create product ${i + 1}:`, productError)
            // Continue with next product if one fails
            continue
          }
        }

        progress.push({
          step: 'product_creation',
          status: 'completed',
          progress: 95,
          message: `Created ${products.length} products successfully`,
        })
      }

      // Update deployment status
      await supabase
        .from('store_creation_jobs')
        .update({
          deployment_status: 'live',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job!.id)

      await supabase
        .from('shopify_stores')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId)

      progress.push({
        step: 'deployment',
        status: 'completed',
        progress: 100,
        message: 'Store deployed successfully!',
      })

      return {
        success: true,
        storeId,
        jobId: job!.id,
        progress,
      }
    } catch (error) {
      progress.push({
        step: 'error',
        status: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
      })

      await supabase
        .from('store_creation_jobs')
        .update({
          deployment_status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job!.id)

      return {
        success: false,
        jobId: job!.id,
        progress,
      }
    }
  }

  async getProgress(jobId: string): Promise<StoreCreationProgress[]> {
    const supabase = await createSupabaseClient()
    
    const { data: job } = await supabase
      .from('store_creation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (!job) {
      return []
    }

    // Return progress based on deployment status
    const progress: StoreCreationProgress[] = []

    if (job.deployment_status === 'pending') {
      progress.push({ step: 'initializing', status: 'pending', progress: 0 })
    } else if (job.deployment_status === 'deploying') {
      progress.push({ step: 'deploying', status: 'running', progress: 50 })
    } else if (job.deployment_status === 'live') {
      progress.push({ step: 'completed', status: 'completed', progress: 100 })
    } else if (job.deployment_status === 'failed') {
      progress.push({ step: 'failed', status: 'failed', progress: 0 })
    }

    return progress
  }
}

export const storeCreationWorkflow = new StoreCreationWorkflow()

