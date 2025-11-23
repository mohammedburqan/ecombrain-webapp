import { createSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export default async function AnalyticsPage() {
  const user = await requireAuth()
  const supabase = await createSupabaseClient()
  
  // Get ROI data
  const roiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/roi`, {
    headers: {
      Cookie: `sb-access-token=${user.id}`, // Simplified - in production use proper auth
    },
  })
  const roiData = await roiResponse.json().catch(() => ({ roi: {} }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-white/80">Track your platform performance and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h3 className="text-white/70 text-sm font-medium">Store Success Rate</h3>
          <p className="text-3xl font-bold mt-2 text-white">
            {roiData.roi?.storeCreationSuccessRate?.toFixed(1) || 0}%
          </p>
        </div>

        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h3 className="text-white/70 text-sm font-medium">Task Success Rate</h3>
          <p className="text-3xl font-bold mt-2 text-white">
            {roiData.roi?.taskSuccessRate?.toFixed(1) || 0}%
          </p>
        </div>

        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h3 className="text-white/70 text-sm font-medium">Total Stores</h3>
          <p className="text-3xl font-bold mt-2 text-white">{roiData.roi?.totalStores || 0}</p>
        </div>

        <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
          <h3 className="text-white/70 text-sm font-medium">Active Stores</h3>
          <p className="text-3xl font-bold mt-2 text-white">{roiData.roi?.activeStores || 0}</p>
        </div>
      </div>

      <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
        <h2 className="text-xl font-bold mb-4 text-white">Performance Metrics</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-white/80">Total Jobs: <span className="text-white font-semibold">{roiData.roi?.totalJobs || 0}</span></p>
            <p className="text-sm text-white/80">Successful Jobs: <span className="text-white font-semibold">{roiData.roi?.successfulJobs || 0}</span></p>
          </div>
          <div>
            <p className="text-sm text-white/80">Total Tasks: <span className="text-white font-semibold">{roiData.roi?.totalTasks || 0}</span></p>
            <p className="text-sm text-white/80">Successful Tasks: <span className="text-white font-semibold">{roiData.roi?.successfulTasks || 0}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}

