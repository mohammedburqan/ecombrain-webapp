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
    shopifyDomain: '',
    apiKey: '',
    apiSecret: '',
    adminApiAccessToken: '',
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
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to generate color schemes (${response.status})`)
      }
      
      if (data.success) {
        setColorSchemes(data.data?.schemes || [])
      } else {
        setError(data.error || 'Failed to generate color schemes')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate color schemes'
      setError(errorMessage.includes('API key') 
        ? 'Gemini API key is not configured. Please contact support.'
        : errorMessage
      )
    } finally {
      setLoading(false)
    }
  }

  const handleStoreCreation = async () => {
    if (!formData.storeName) {
      setError('Store name is required')
      return
    }

    if (!formData.shopifyDomain || !formData.apiKey || !formData.apiSecret || !formData.adminApiAccessToken) {
      setError('Please complete the Shopify API credentials step first')
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
          shopifyDomain: formData.shopifyDomain,
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          adminApiAccessToken: formData.adminApiAccessToken,
        }),
      })

      // Check if response is ok and content-type is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        setError(`Server error: ${response.status} ${response.statusText}. ${text.substring(0, 200)}`)
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
        setError(errorData.error || `Request failed with status ${response.status}`)
        return
      }

      const data = await response.json()
      
      if (data.success) {
        router.push(`/dashboard/shopify/${data.storeId}`)
      } else {
        setError(data.error || 'Failed to create store')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create store. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-white">Create New Store</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-white px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-[#1e2d5f] rounded-lg border border-[#2a3b75] shadow p-6">
        {/* Step 1: Niche Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Step 1: Choose Your Niche</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  Describe your niche or business idea
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-[#19254f] border border-[#2a3b75] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1]"
                  rows={4}
                  value={formData.nicheDescription}
                  onChange={(e) => setFormData({ ...formData, nicheDescription: e.target.value })}
                  placeholder="e.g., Sustainable eco-friendly products for millennials"
                />
              </div>
              <button
                onClick={handleNicheSearch}
                disabled={loading || !formData.nicheDescription}
                className="px-4 py-2 bg-[#3194d1] text-white rounded-md hover:bg-[#267ab0] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Get Niche Recommendations'}
              </button>

              {nicheRecommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3 text-white">Recommended Niches:</h3>
                  <div className="space-y-2">
                    {nicheRecommendations.map((niche: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => {
                          setFormData({ ...formData, selectedNiche: niche.niche_name })
                          setStep(2)
                        }}
                        className="p-4 bg-[#19254f] border border-[#2a3b75] rounded-md hover:border-[#3194d1] cursor-pointer transition-colors"
                      >
                        <h4 className="font-bold text-white">{niche.niche_name}</h4>
                        <p className="text-sm text-white/70">Opportunity: {niche.market_opportunity}/10</p>
                        <p className="text-sm text-white/70">Competition: {niche.competition_level}/10</p>
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
            <h2 className="text-2xl font-bold mb-4 text-white">Step 2: Choose Color Scheme</h2>
            <div className="space-y-4">
              <p className="text-white/80">Selected Niche: <span className="text-white font-semibold">{formData.selectedNiche}</span></p>
              <button
                onClick={handleColorSchemeGeneration}
                disabled={loading}
                className="px-4 py-2 bg-[#3194d1] text-white rounded-md hover:bg-[#267ab0] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Color Schemes'}
              </button>

              {colorSchemes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3 text-white">Color Scheme Options:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {colorSchemes.map((scheme: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => {
                          setFormData({ ...formData, selectedColorScheme: scheme })
                          setStep(3)
                        }}
                        className="p-4 bg-[#19254f] border border-[#2a3b75] rounded-md hover:border-[#3194d1] cursor-pointer transition-colors"
                      >
                        <div className="flex gap-2 mb-2">
                          <div
                            className="w-12 h-12 rounded border border-[#2a3b75]"
                            style={{ backgroundColor: scheme.primary_color }}
                          />
                          <div
                            className="w-12 h-12 rounded border border-[#2a3b75]"
                            style={{ backgroundColor: scheme.secondary_color }}
                          />
                        </div>
                        <p className="text-sm text-white/80">{scheme.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Shopify API Credentials */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Step 3: Connect Your Shopify Store</h2>
            <div className="space-y-6">
              <div className="bg-[#3194d1]/10 border border-[#3194d1]/30 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">How to get your Shopify API credentials:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-white/80">
                  <li>Log in to your Shopify admin panel</li>
                  <li>Navigate to <strong>Settings</strong> → <strong>Apps and sales channels</strong></li>
                  <li>Click on <strong>Develop apps</strong> (or "Develop apps for your store")</li>
                  <li>Click <strong>Create an app</strong> and give it a name (e.g., "EcomBrain Integration")</li>
                  <li>Under <strong>Admin API integration</strong>, click <strong>Configure Admin API scopes</strong></li>
                  <li>Select <strong>all permissions</strong> or at least: read_products, write_products, read_themes, write_themes, read_orders, write_orders</li>
                  <li>Click <strong>Save</strong> to apply the permissions</li>
                  <li>Click <strong>Install app</strong> to generate the Admin API access token</li>
                  <li>Click <strong>Reveal token once</strong> to view your Admin API access token (copy it immediately - it won't be shown again!)</li>
                  <li>Copy the <strong>API key</strong> and <strong>API secret key</strong> from the app's API credentials section</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">
                    Shopify Store Domain <span className="text-white">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-[#19254f] border border-[#2a3b75] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1]"
                    value={formData.shopifyDomain}
                    onChange={(e) => setFormData({ ...formData, shopifyDomain: e.target.value })}
                    placeholder="your-store.myshopify.com"
                  />
                  <p className="text-xs text-white/60 mt-1">Enter your store domain (e.g., mystore.myshopify.com)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">
                    API Key <span className="text-white">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-[#19254f] border border-[#2a3b75] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1]"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Your API Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">
                    API Secret Key <span className="text-white">*</span>
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-[#19254f] border border-[#2a3b75] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1]"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    placeholder="Your API Secret Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">
                    Admin API Access Token <span className="text-white">*</span>
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-[#19254f] border border-[#2a3b75] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1]"
                    value={formData.adminApiAccessToken}
                    onChange={(e) => setFormData({ ...formData, adminApiAccessToken: e.target.value })}
                    placeholder="Your Admin API Access Token"
                  />
                  <p className="text-xs text-white/60 mt-1">This token is shown only once when you install the app. Make sure to copy it!</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-[#2a3b75] text-white rounded-md hover:bg-[#3194d1]/20 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!formData.shopifyDomain || !formData.apiKey || !formData.apiSecret || !formData.adminApiAccessToken}
                  className="px-4 py-2 bg-[#3194d1] text-white rounded-md hover:bg-[#267ab0] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Store Configuration */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Step 4: Store Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Store Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-[#19254f] border border-[#2a3b75] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3194d1]"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="My Awesome Store"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-[#2a3b75] text-white rounded-md hover:bg-[#3194d1]/20 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleStoreCreation}
                  disabled={loading || !formData.storeName}
                  className="px-4 py-2 bg-[#3194d1] text-white rounded-md hover:bg-[#267ab0] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
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

