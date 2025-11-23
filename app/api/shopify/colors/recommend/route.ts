import { NextRequest, NextResponse } from 'next/server'
import { requireAuthForAPI } from '@/lib/auth'
import { ColorSchemeAgent } from '@/lib/agents/color-scheme'

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

    if (!body.niche) {
      return NextResponse.json(
        { error: 'Niche is required', success: false },
        { status: 400 }
      )
    }

    const agent = new ColorSchemeAgent('temp-color', 'Color Scheme Agent')
    
    if (body.multiple && body.count) {
      const result = await agent.generateMultipleSchemes(body.niche, body.count)
      return NextResponse.json(result)
    } else {
      const result = await agent.execute({
        niche: body.niche,
        brandPersonality: body.brandPersonality,
      })
      return NextResponse.json(result)
    }
  } catch (error: any) {
    console.error('Color recommendation error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get color recommendations',
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

