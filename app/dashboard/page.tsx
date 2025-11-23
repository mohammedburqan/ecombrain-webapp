import { createSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createSupabaseClient()
  
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400">Welcome back to ecom SHARKS. Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h3 className="text-gray-400 text-sm font-medium">Total Agents</h3>
          <p className="text-3xl font-bold mt-2 text-white">{totalAgents}</p>
        </div>

        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h3 className="text-gray-400 text-sm font-medium">Active Tasks</h3>
          <p className="text-3xl font-bold mt-2 text-white">{activeTasks}</p>
        </div>

        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h3 className="text-gray-400 text-sm font-medium">Success Rate</h3>
          <p className="text-3xl font-bold mt-2 text-white">{successRate}%</p>
        </div>

        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h3 className="text-gray-400 text-sm font-medium">Active Stores</h3>
          <p className="text-3xl font-bold mt-2 text-white">{activeStores}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/dashboard/shopify/create"
              className="block px-4 py-2 bg-[#3194d1] text-white rounded-md hover:bg-[#267ab0] text-center transition-colors"
            >
              Create New Store
            </Link>
            <Link
              href="/dashboard/agents"
              className="block px-4 py-2 bg-[#2a3b75] text-gray-200 rounded-md hover:bg-[#3194d1]/20 text-center transition-colors"
            >
              Manage Agents
            </Link>
            <Link
              href="/dashboard/tasks"
              className="block px-4 py-2 bg-[#2a3b75] text-gray-200 rounded-md hover:bg-[#3194d1]/20 text-center transition-colors"
            >
              View Tasks
            </Link>
          </div>
        </div>

        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h2 className="text-xl font-bold mb-4 text-white">Recent Activity</h2>
          <div className="space-y-2">
            {tasks && tasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex justify-between items-center py-2 border-b border-[#2a3b75]">
                <span className="text-sm text-gray-300">{task.task_type}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  task.status === 'running' ? 'bg-[#3194d1]/20 text-[#3194d1] border border-[#3194d1]/30' :
                  task.status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
            {(!tasks || tasks.length === 0) && (
              <p className="text-gray-400 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

