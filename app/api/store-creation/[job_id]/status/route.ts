import { NextRequest, NextResponse } from 'next/server'
import { requireAuthForAPI } from '@/lib/auth'
import { storeCreationWorkflow } from '@/lib/workflows/store-creation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const user = await requireAuthForAPI()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const { job_id } = await params

    const progress = await storeCreationWorkflow.getProgress(job_id)

    return NextResponse.json({ progress })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    )
  }
}

