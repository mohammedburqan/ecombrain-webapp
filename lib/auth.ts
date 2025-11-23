import { createSupabaseServerComponentClient } from './supabase/server'
import { Database } from '@/types/database'

type UserRole = Database['public']['Tables']['users']['Row']['role']

export async function getCurrentUser() {
  const supabase = await createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userData ? { ...user, ...userData } : null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  return user
}

export async function hasRole(role: UserRole) {
  const user = await getCurrentUser()
  return user?.role === role
}

