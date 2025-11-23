import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { requireAuthForAPI } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthForAPI()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = await createSupabaseClient()
    
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
    const user = await requireAuthForAPI()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Try with regular client first
    const supabase = await createSupabaseClient()
    let result = await supabase
      .from('agents')
      .insert({
        name: body.name,
        type: body.type,
        status: body.status || 'active',
        config: body.config || {},
      })
      .select()
      .single()

    // If RLS error occurs, try with service role client as fallback
    if (result.error && (result.error.message.includes('policy') || result.error.message.includes('recursion') || result.error.message.includes('infinite'))) {
      try {
        const serviceClient = createSupabaseServiceRoleClient()
        
        result = await serviceClient
          .from('agents')
          .insert({
            name: body.name,
            type: body.type,
            status: body.status || 'active',
            config: body.config || {},
          })
          .select()
          .single()
      } catch (serviceError: any) {
        console.error('Service role client also failed:', serviceError)
        // Continue with original error
      }
    }

    if (result.error) {
      console.error('Agent creation error:', result.error)
      throw result.error
    }

    return NextResponse.json({ agent: result.data, success: true })
  } catch (error: any) {
    console.error('Failed to create agent:', error)
    
    // Provide helpful error messages for common issues
    let errorMessage = error.message || 'Failed to create agent'
    
    // Check for Supabase API key errors
    if (errorMessage.includes('NEXT_PUBLIC_SUPABASE_URL') || errorMessage.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') || errorMessage.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      errorMessage = `Configuration error: ${errorMessage}. Please ensure all Supabase environment variables are set in your .env.local file.`
    }
    
    // Check for Supabase API key validation errors
    if (errorMessage.includes('Invalid API key') || errorMessage.includes('invalid') && errorMessage.includes('key')) {
      errorMessage = 'Invalid Supabase API key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local file.'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: error.message?.includes('Unauthorized') || error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

