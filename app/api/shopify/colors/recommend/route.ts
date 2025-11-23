import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ColorSchemeAgent } from '@/lib/agents/color-scheme'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

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
    return NextResponse.json(
      { error: error.message || 'Failed to get color recommendations' },
      { status: 500 }
    )
  }
}

