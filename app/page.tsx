import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const code = params.code

  // If there's an OAuth code in the URL, redirect to callback handler
  if (code && typeof code === 'string') {
    redirect(`/auth/callback?code=${code}`)
  }

  const supabase = await createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
