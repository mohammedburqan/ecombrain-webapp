import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createSupabaseServerComponentClient()
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ agents: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agents' },
      { status: error.message?.includes('Unauthorized') || error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createSupabaseServerComponentClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('agents')
      .insert({
        name: body.name,
        type: body.type,
        status: body.status || 'active',
        config: body.config || {},
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ agent: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create agent' },
      { status: error.message?.includes('Unauthorized') || error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

