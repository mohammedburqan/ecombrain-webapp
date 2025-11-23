'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateStorePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    storeName: '',
    nicheDescription: '',
    selectedNiche: '',
    selectedColorScheme: null as any,
    products: [] as any[],
  })

  const [nicheRecommendations, setNicheRecommendations] = useState<any[]>([])
  const [colorSchemes, setColorSchemes] = useState<any[]>([])
  const [productRecommendations, setProductRecommendations] = useState<any[]>([])

  const handleNicheSearch = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/shopify/niche/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nicheDescription: formData.nicheDescription,
          multiple: true,
          count: 5,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setNicheRecommendations(data.data?.niches || [])
      } else {
        setError(data.error || 'Failed to get niche recommendations')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get niche recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleColorSchemeGeneration = async () => {
    if (!formData.selectedNiche) {
      setError('Please select a niche first')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/shopify/colors/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: formData.selectedNiche,
          multiple: true,
          count: 3,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setColorSchemes(data.data?.schemes || [])
      } else {
        setError(data.error || 'Failed to generate color schemes')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate color schemes')
    } finally {
      setLoading(false)
    }
  }

  const handleStoreCreation = async () => {
    if (!formData.storeName) {
      setError('Store name is required')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/store-creation/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: formData.storeName,
          nicheDescription: formData.nicheDescription,
          selectedNiche: formData.selectedNiche,
          selectedColorScheme: formData.selectedColorScheme,
          products: formData.products,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        router.push(`/dashboard/shopify/${data.storeId}`)
      } else {
        setError(data.error || 'Failed to create store')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create store')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Store</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Step 1: Niche Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Step 1: Choose Your Niche</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Describe your niche or business idea
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  value={formData.nicheDescription}
                  onChange={(e) => setFormData({ ...formData, nicheDescription: e.target.value })}
                  placeholder="e.g., Sustainable eco-friendly products for millennials"
                />
              </div>
              <button
                onClick={handleNicheSearch}
                disabled={loading || !formData.nicheDescription}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Get Niche Recommendations'}
              </button>

              {nicheRecommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Recommended Niches:</h3>
                  <div className="space-y-2">
                    {nicheRecommendations.map((niche: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => {
                          setFormData({ ...formData, selectedNiche: niche.niche_name })
                          setStep(2)
                        }}
                        className="p-4 border border-gray-200 rounded-md hover:border-indigo-500 cursor-pointer"
                      >
                        <h4 className="font-bold">{niche.niche_name}</h4>
                        <p className="text-sm text-gray-600">Opportunity: {niche.market_opportunity}/10</p>
                        <p className="text-sm text-gray-600">Competition: {niche.competition_level}/10</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Color Scheme */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Step 2: Choose Color Scheme</h2>
            <div className="space-y-4">
              <p className="text-gray-600">Selected Niche: {formData.selectedNiche}</p>
              <button
                onClick={handleColorSchemeGeneration}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Color Schemes'}
              </button>

              {colorSchemes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Color Scheme Options:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {colorSchemes.map((scheme: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => {
                          setFormData({ ...formData, selectedColorScheme: scheme })
                          setStep(3)
                        }}
                        className="p-4 border border-gray-200 rounded-md hover:border-indigo-500 cursor-pointer"
                      >
                        <div className="flex gap-2 mb-2">
                          <div
                            className="w-12 h-12 rounded"
                            style={{ backgroundColor: scheme.primary_color }}
                          />
                          <div
                            className="w-12 h-12 rounded"
                            style={{ backgroundColor: scheme.secondary_color }}
                          />
                        </div>
                        <p className="text-sm">{scheme.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Store Configuration */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Step 3: Store Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Store Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="My Awesome Store"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handleStoreCreation}
                  disabled={loading || !formData.storeName}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Store...' : 'Create Store'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

