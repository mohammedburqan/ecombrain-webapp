import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createSupabaseServerComponentClient()
    
    const { data, error } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ stores: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createSupabaseServerComponentClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('shopify_stores')
      .insert({
        user_id: user.id,
        store_name: body.storeName,
        shopify_domain: body.domain || `${body.storeName.toLowerCase().replace(/\s+/g, '-')}.myshopify.com`,
        access_token: body.accessToken || '',
        status: 'creating',
        store_config: body.config || {},
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ store: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create store' },
      { status: 500 }
    )
  }
}

