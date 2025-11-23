import { NextRequest, NextResponse } from 'next/server'
import { requireAuthForAPI } from '@/lib/auth'
import { orchestrator } from '@/lib/agents/orchestrator'

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

