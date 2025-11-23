'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AGENT_TYPES = [
  { value: 'market_intelligence', label: 'Market Intelligence' },
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'video_generation', label: 'Video Generation' },
  { value: 'market_gap', label: 'Market Gap' },
  { value: 'shopify_store_creation', label: 'Shopify Store Creation' },
  { value: 'niche_selection', label: 'Niche Selection' },
  { value: 'color_scheme', label: 'Color Scheme' },
  { value: 'product_management', label: 'Product Management' },
  { value: 'shopify_deployment', label: 'Shopify Deployment' },
] as const

interface CreateAgentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<typeof AGENT_TYPES[number]['value']>('market_intelligence')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          status: 'active',
          config: {},
        }),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Server error: ${response.status}. ${text.substring(0, 200)}`)
      }

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to create agent'
        // Provide helpful message for RLS errors
        if (errorMessage.includes('recursion') || errorMessage.includes('policy')) {
          throw new Error('Database policy error. Please contact support or run the RLS fix migration.')
        }
        // Provide helpful message for API key errors
        if (errorMessage.includes('API key') || errorMessage.includes('environment variable') || errorMessage.includes('Configuration error')) {
          throw new Error(errorMessage)
        }
        throw new Error(errorMessage)
      }

      // Reset form and close modal
      setName('')
      setType('market_intelligence')
      onClose()
      router.refresh()
    } catch (err: any) {
      console.error('Agent creation error:', err)
      setError(err.message || 'Failed to create agent. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e2d5f] border border-[#2a3b75] rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl font-bold"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-white px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                Agent Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#19254f] border border-[#2a3b75] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1]"
                placeholder="Enter agent name"
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="type" className="block text-sm font-medium text-white/80 mb-2">
                Agent Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof AGENT_TYPES[number]['value'])}
                className="w-full px-3 py-2 bg-[#19254f] border border-[#2a3b75] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3194d1]"
                disabled={loading}
              >
                {AGENT_TYPES.map((agentType) => (
                  <option key={agentType.value} value={agentType.value} className="bg-[#19254f]">
                    {agentType.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-white bg-[#2a3b75] rounded-md hover:bg-[#3194d1]/20 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2 bg-[#3194d1] text-white rounded-md hover:bg-[#267ab0] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

