import { redirect } from 'next/navigation'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
