import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { storeCreationWorkflow } from '@/lib/workflows/store-creation'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const result = await storeCreationWorkflow.execute({
      userId: user.id,
      storeName: body.storeName,
      nicheDescription: body.nicheDescription,
      selectedNiche: body.selectedNiche,
      selectedColorScheme: body.selectedColorScheme,
      products: body.products,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initiate store creation' },
      { status: 500 }
    )
  }
}

