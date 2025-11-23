import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const allProjects = await db.select().from(projects)
    return NextResponse.json({ projects: allProjects })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newProject = await db.insert(projects).values({
      name: body.name,
      description: body.description,
      status: body.status || 'active',
      metadata: body.metadata || null,
    }).returning()

    return NextResponse.json({ project: newProject[0] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}

