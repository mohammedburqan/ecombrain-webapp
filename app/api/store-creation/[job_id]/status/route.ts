import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { storeCreationWorkflow } from '@/lib/workflows/store-creation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const user = await requireAuth()
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

