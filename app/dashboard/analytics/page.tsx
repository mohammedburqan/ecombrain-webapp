import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export default async function AnalyticsPage() {
  const user = await requireAuth()
  const supabase = await createSupabaseServerComponentClient()
  
  // Get ROI data
  const roiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/roi`, {
    headers: {
      Cookie: `sb-access-token=${user.id}`, // Simplified - in production use proper auth
    },
  })
  const roiData = await roiResponse.json().catch(() => ({ roi: {} }))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Store Success Rate</h3>
          <p className="text-3xl font-bold mt-2">
            {roiData.roi?.storeCreationSuccessRate?.toFixed(1) || 0}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Task Success Rate</h3>
          <p className="text-3xl font-bold mt-2">
            {roiData.roi?.taskSuccessRate?.toFixed(1) || 0}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Stores</h3>
          <p className="text-3xl font-bold mt-2">{roiData.roi?.totalStores || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Stores</h3>
          <p className="text-3xl font-bold mt-2">{roiData.roi?.activeStores || 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Total Jobs: {roiData.roi?.totalJobs || 0}</p>
            <p className="text-sm text-gray-600">Successful Jobs: {roiData.roi?.successfulJobs || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Tasks: {roiData.roi?.totalTasks || 0}</p>
            <p className="text-sm text-gray-600">Successful Tasks: {roiData.roi?.successfulTasks || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

