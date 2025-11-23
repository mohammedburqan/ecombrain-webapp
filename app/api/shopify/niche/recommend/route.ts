import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { NicheSelectionAgent } from '@/lib/agents/niche-selection'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const agent = new NicheSelectionAgent('temp-niche', 'Niche Selection Agent')
    
    if (body.multiple && body.count) {
      const result = await agent.recommendMultipleNiches(body.count)
      return NextResponse.json(result)
    } else {
      const result = await agent.execute({
        nicheDescription: body.nicheDescription || body.query,
      })
      return NextResponse.json(result)
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get niche recommendations' },
      { status: 500 }
    )
  }
}

