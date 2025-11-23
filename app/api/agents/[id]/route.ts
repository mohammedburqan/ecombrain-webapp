import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createSupabaseServerComponentClient()
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ agent: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createSupabaseServerComponentClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('agents')
      .update({
        name: body.name,
        status: body.status,
        config: body.config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ agent: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update agent' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createSupabaseServerComponentClient()

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete agent' },
      { status: 500 }
    )
  }
}

