import { redirect } from 'next/navigation'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 min-h-screen">
          <div className="p-6">
            <h1 className="text-white text-2xl font-bold">EcomBrain</h1>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/agents"
              className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
            >
              Agents
            </Link>
            <Link
              href="/dashboard/shopify"
              className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
            >
              Shopify Stores
            </Link>
            <Link
              href="/dashboard/tasks"
              className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
            >
              Tasks
            </Link>
            <Link
              href="/dashboard/analytics"
              className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
            >
              Analytics
            </Link>
            {userData?.role === 'admin' && (
              <>
                <Link
                  href="/dashboard/users"
                  className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  Users
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  Settings
                </Link>
              </>
            )}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <LogoutButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

