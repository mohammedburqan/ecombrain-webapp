import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { orchestrator } from '@/lib/agents/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const result = await orchestrator.executeWorkflow(
      body.task,
      user.id,
      body.context
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to execute collaboration' },
      { status: 500 }
    )
  }
}

