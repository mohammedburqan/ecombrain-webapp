import { NextRequest, NextResponse } from 'next/server'
import { webhookHandler } from '@/lib/shopify/webhooks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())

    // In production, verify webhook signature here
    await webhookHandler.handleWebhook({
      topic: headers['x-shopify-topic'] || 'unknown',
      shop: headers['x-shopify-shop-domain'] || '',
      data: body,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

