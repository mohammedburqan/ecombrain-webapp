import { NextRequest, NextResponse } from 'next/server'
import { requireAuthForAPI } from '@/lib/auth'
import { storeCreationWorkflow } from '@/lib/workflows/store-creation'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthForAPI()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (!body.storeName) {
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      )
    }

    const result = await storeCreationWorkflow.execute({
      userId: user.id,
      storeName: body.storeName,
      nicheDescription: body.nicheDescription,
      selectedNiche: body.selectedNiche,
      selectedColorScheme: body.selectedColorScheme,
      products: body.products,
      shopifyDomain: body.shopifyDomain,
      apiKey: body.apiKey,
      apiSecret: body.apiSecret,
      adminApiAccessToken: body.adminApiAccessToken,
    })

    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error: any) {
    console.error('Store creation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to initiate store creation',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

