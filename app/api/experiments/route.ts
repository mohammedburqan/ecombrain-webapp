import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { experiments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('project_id')

    let query = db.select().from(experiments)

    if (projectId) {
      query = db.select().from(experiments).where(eq(experiments.projectId, projectId))
    }

    const allExperiments = await query
    return NextResponse.json({ experiments: allExperiments })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch experiments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newExperiment = await db.insert(experiments).values({
      projectId: body.projectId,
      name: body.name,
      description: body.description,
      status: body.status || 'draft',
      variant: body.variant || null,
      results: body.results || null,
      config: body.config || null,
    }).returning()

    return NextResponse.json({ experiment: newExperiment[0] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create experiment' },
      { status: 500 }
    )
  }
}

