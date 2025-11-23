import { createSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export default async function TasksPage() {
  const user = await requireAuth()
  const supabase = await createSupabaseClient()
  
  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('*, agents(name, type)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Tasks</h1>
        <p className="text-white/80">Monitor and manage your agent tasks</p>
      </div>

      <div className="bg-[#1e2d5f] rounded-xl border border-[#2a3b75] overflow-hidden">
        <table className="min-w-full divide-y divide-[#2a3b75]">
          <thead className="bg-[#152042]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Task Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Started</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Completed</th>
            </tr>
          </thead>
          <tbody className="bg-[#1e2d5f] divide-y divide-[#2a3b75]">
            {tasks && tasks.map((task: any) => (
              <tr key={task.id} className="hover:bg-[#2a3b75]/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {task.task_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {task.agents?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    task.status === 'completed' ? 'bg-green-500/20 text-white border border-green-500/30' :
                    task.status === 'running' ? 'bg-[#3194d1]/20 text-white border border-[#3194d1]/30' :
                    task.status === 'failed' ? 'bg-red-500/20 text-white border border-red-500/30' :
                    'bg-gray-500/20 text-white border border-gray-500/30'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                  {task.started_at ? new Date(task.started_at).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                  {task.completed_at ? new Date(task.completed_at).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
            {(!tasks || tasks.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-white/70">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

