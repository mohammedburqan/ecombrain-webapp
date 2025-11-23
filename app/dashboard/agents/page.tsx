import { createSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import AgentsList from '@/components/AgentsList'

export default async function AgentsPage() {
  await requireAuth()
  const supabase = await createSupabaseClient()
  
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false })

  return <AgentsList agents={agents} />
}

