import { createSupabaseClient } from './supabase/server'
import { Database } from '@/types/database'
import { redirect } from 'next/navigation'

type UserRole = Database['public']['Tables']['users']['Row']['role']

export async function getCurrentUser() {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Try to get user data from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // If user doesn't exist in users table but exists in auth, create the record
  if (!userData) {
    // User exists in auth but not in users table - create the record
    const { data: newUserData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        role: 'user',
      })
      .select()
      .single()

    if (newUserData) {
      return { ...user, ...newUserData }
    }
    
    // If insert fails (e.g., due to race condition or constraint), try to fetch again
    if (insertError) {
      const { data: retryUserData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (retryUserData) {
        return { ...user, ...retryUserData }
      }
    }
    
    // If we still don't have userData, return auth user with default role
    // This ensures authenticated users are never treated as unauthorized
    return { ...user, role: 'user' as UserRole }
  }

  return { ...user, ...userData }
}

/**
 * Requires authentication for server components.
 * Redirects to login if user is not authenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Requires authentication for API routes.
 * Returns null if user is not authenticated, allowing the route to return a 401 response.
 */
export async function requireAuthForAPI() {
  const user = await getCurrentUser()
  if (!user) {
    return null
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

/**
 * Requires admin role for API routes.
 * Returns null if user is not authenticated or not admin, allowing the route to return a 401/403 response.
 */
export async function requireAdminForAPI() {
  const user = await requireAuthForAPI()
  if (!user) {
    return null
  }
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  return user
}

export async function hasRole(role: UserRole) {
  const user = await getCurrentUser()
  return user?.role === role
}

