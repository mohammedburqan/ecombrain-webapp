'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      const origin = window.location.origin
      const redirectTo = `${origin}/auth/callback`
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }

      // The redirect will happen automatically, so we don't need to do anything here
      // The loading state will be reset when the page redirects
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setError(error.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#19254f]">
      {/* Left Side - Branding */}
      <div className="hidden md:flex w-1/2 bg-[#1e2d5f] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <Image src="/pattern.svg" alt="Pattern" fill className="object-cover" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-48 h-20 relative mx-auto mb-8">
            <Image src="/logo.svg" alt="ecom SHARKS Logo" fill className="object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to <span className="text-[#3194d1]">ecom SHARKS</span>
          </h1>
          <p className="text-white/80 text-lg max-w-md mx-auto">
            Your intelligent command center for e-commerce dominance.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="md:hidden text-center mb-8">
            <div className="w-32 h-16 relative mx-auto mb-4">
              <Image src="/logo.svg" alt="ecom SHARKS Logo" fill className="object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              ecom <span className="text-[#3194d1]">SHARKS</span>
            </h2>
          </div>

          <div className="bg-[#1e2d5f] p-8 rounded-xl border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign in to your account</h2>

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-white text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-[#19254f] border border-[#2a3b75] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1] focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-[#19254f] border border-[#2a3b75] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1] focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <Link href="/forgot-password" className="text-sm text-[#3194d1] hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#3194d1] hover:bg-[#267ab0] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-[#3194d1]/20 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#2a3b75]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1e2d5f] text-white/60">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors border border-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>

                <Link
                  href="/signup"
                  className="w-full bg-transparent border border-[#3194d1] text-[#3194d1] hover:bg-[#3194d1]/10 font-bold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  Create Account
                </Link>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-white/70">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-[#3194d1] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-[#3194d1] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

