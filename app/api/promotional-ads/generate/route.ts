import { NextRequest, NextResponse } from 'next/server'
import { requireAuthForAPI } from '@/lib/auth'
import { 
  generatePromotionalAdFromUrl, 
  generatePromotionalAdImage,
  fetchProductInfoFromUrl 
} from '@/lib/utils/image-generation'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthForAPI()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productUrl, productInfo, style = 'modern' } = body

    // Validate input
    if (!productUrl && !productInfo) {
      return NextResponse.json(
        { error: 'Either productUrl or productInfo is required', success: false },
        { status: 400 }
      )
    }

    let adImageUrl: string

    if (productUrl) {
      // Generate ad from product URL
      try {
        adImageUrl = await generatePromotionalAdFromUrl(productUrl, style)
      } catch (error) {
        console.error('Error generating ad from URL:', error)
        return NextResponse.json(
          { 
            error: `Failed to generate ad from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
            success: false 
          },
          { status: 500 }
        )
      }
    } else if (productInfo) {
      // Generate ad from provided product info
      try {
        adImageUrl = await generatePromotionalAdImage(productInfo, style)
      } catch (error) {
        console.error('Error generating ad from product info:', error)
        return NextResponse.json(
          { 
            error: `Failed to generate ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
            success: false 
          },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request: missing productUrl or productInfo', success: false },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      adImageUrl,
      style,
      productUrl: productUrl || null,
    })
  } catch (error: any) {
    console.error('Promotional ad generation error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate promotional ad',
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to fetch product info from URL (useful for preview)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthForAPI()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productUrl = searchParams.get('url')

    if (!productUrl) {
      return NextResponse.json(
        { error: 'Product URL is required', success: false },
        { status: 400 }
      )
    }

    try {
      const productInfo = await fetchProductInfoFromUrl(productUrl)
      return NextResponse.json({
        success: true,
        productInfo,
      })
    } catch (error) {
      console.error('Error fetching product info:', error)
      return NextResponse.json(
        { 
          error: `Failed to fetch product info: ${error instanceof Error ? error.message : 'Unknown error'}`,
          success: false 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Product info fetch error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch product information',
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

