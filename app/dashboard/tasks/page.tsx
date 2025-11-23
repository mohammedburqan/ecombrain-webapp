import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export default async function TasksPage() {
  const user = await requireAuth()
  const supabase = await createSupabaseServerComponentClient()
  
  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('*, agents(name, type)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Tasks</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks && tasks.map((task: any) => (
              <tr key={task.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {task.task_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.agents?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.started_at ? new Date(task.started_at).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.completed_at ? new Date(task.completed_at).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
            {(!tasks || tasks.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
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

