"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Store, ListTodo, BarChart3, Users, Settings, LogOut, Bot, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/dashboard/agents", icon: Bot },
  { name: "Shopify Stores", href: "/dashboard/shopify", icon: Store },
  { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
]

const adminNavigation = [
  { name: "Admin Portal", href: "/dashboard/admin", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="hidden md:flex w-64 flex-col bg-[#152042] border-r border-[#2a3b75]">
      <div className="flex h-16 items-center px-6 border-b border-[#2a3b75]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative h-8 w-32">
            <Image src="/logo.svg" alt="ecom SHARKS Logo" fill className="object-contain" />
          </div>
        </Link>
      </div>
      <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider">Platform</div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[#3194d1]/10 text-[#3194d1]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
        {userRole === 'admin' && (
          <>
            <div className="text-xs font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider mt-4">Administration</div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-[#3194d1]/10 text-[#3194d1]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </div>
      <div className="p-4 border-t border-[#2a3b75]">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

