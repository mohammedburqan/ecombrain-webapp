import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerComponentClient()
  
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .eq('status', 'active')

  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('status')

  const { data: stores } = await supabase
    .from('shopify_stores')
    .select('status')

  const totalAgents = agents?.length || 0
  const activeTasks = tasks?.filter((t) => t.status === 'running').length || 0
  const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0
  const totalTasks = tasks?.length || 0
  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const activeStores = stores?.filter((s) => s.status === 'active').length || 0

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Agents</h3>
          <p className="text-3xl font-bold mt-2">{totalAgents}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Tasks</h3>
          <p className="text-3xl font-bold mt-2">{activeTasks}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Success Rate</h3>
          <p className="text-3xl font-bold mt-2">{successRate}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Stores</h3>
          <p className="text-3xl font-bold mt-2">{activeStores}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/dashboard/shopify/create"
              className="block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
            >
              Create New Store
            </Link>
            <Link
              href="/dashboard/agents"
              className="block px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-center"
            >
              Manage Agents
            </Link>
            <Link
              href="/dashboard/tasks"
              className="block px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-center"
            >
              View Tasks
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {tasks && tasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{task.task_type}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
            {(!tasks || tasks.length === 0) && (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

