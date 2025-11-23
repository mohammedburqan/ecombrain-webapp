import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
