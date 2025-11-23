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
          <p className="text-gray-300 text-lg max-w-md mx-auto">
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
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-[#19254f] border border-[#2a3b75] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3194d1] focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-[#19254f] border border-[#2a3b75] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3194d1] focus:border-transparent transition-all"
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
                <Link
                  href="/signup"
                  className="w-full bg-transparent border border-[#3194d1] text-[#3194d1] hover:bg-[#3194d1]/10 font-bold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  Create Account
                </Link>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500">
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

