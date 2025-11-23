"use client"

import { useState } from 'react'
import { ImageIcon, Loader2, Download, Link as LinkIcon, Sparkles, X } from 'lucide-react'

interface GeneratedAd {
  adImageUrl: string
  style: string
  productUrl: string | null
  productInfo?: {
    title?: string
    description?: string
    price?: string
  }
}

export function PromotionalAdGenerator() {
  const [productUrl, setProductUrl] = useState('')
  const [style, setStyle] = useState<'modern' | 'classic' | 'bold' | 'elegant'>('modern')
  const [loading, setLoading] = useState(false)
  const [productInfo, setProductInfo] = useState<any>(null)
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFetchProductInfo = async () => {
    if (!productUrl.trim()) {
      setError('Please enter a product URL')
      return
    }

    setLoading(true)
    setError(null)
    setProductInfo(null)

    try {
      const response = await fetch(`/api/promotional-ads/generate?url=${encodeURIComponent(productUrl)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product information')
      }

      setProductInfo(data.productInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product information')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAd = async () => {
    if (!productUrl.trim()) {
      setError('Please enter a product URL')
      return
    }

    setLoading(true)
    setError(null)
    
    // If product info hasn't been fetched yet, fetch it first
    if (!productInfo) {
      try {
        const infoResponse = await fetch(`/api/promotional-ads/generate?url=${encodeURIComponent(productUrl)}`)
        const infoData = await infoResponse.json()
        if (infoResponse.ok && infoData.productInfo) {
          setProductInfo(infoData.productInfo)
        }
      } catch (err) {
        // Continue even if product info fetch fails
        console.warn('Failed to fetch product info:', err)
      }
    }

    try {
      const response = await fetch('/api/promotional-ads/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          style,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate promotional ad')
      }

      // Add the new ad to the list
      setGeneratedAds((prev) => [
        {
          adImageUrl: data.adImageUrl,
          style: data.style,
          productUrl: data.productUrl,
          productInfo: productInfo || undefined,
        },
        ...prev,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate promotional ad')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (imageUrl: string, filename: string) => {
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename || 'promotional-ad.png'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      })
      .catch((err) => {
        console.error('Download failed:', err)
        // Fallback: open in new tab
        window.open(imageUrl, '_blank')
      })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#3194d1]" />
          Promotional Ad Generator
        </h1>
        <p className="text-white/80 mt-1">
          Generate professional promotional ad images from any product URL using AI
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75]">
        <div className="space-y-4">
          <div>
            <label htmlFor="product-url" className="block text-sm font-medium text-white mb-2">
              Product URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <input
                  id="product-url"
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://example.com/product/123"
                  className="w-full pl-10 pr-4 py-2 bg-[#152042] border border-[#2a3b75] rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#3194d1] focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleFetchProductInfo()
                    }
                  }}
                />
              </div>
              <button
                onClick={handleFetchProductInfo}
                disabled={loading || !productUrl.trim()}
                className="px-4 py-2 bg-[#2a3b75] text-white rounded-md hover:bg-[#3194d1]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    Read Product
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Product Info Preview */}
          {productInfo && (
            <div className="p-4 bg-[#152042] rounded-md border border-[#2a3b75] relative">
              <button
                onClick={() => {
                  setProductInfo(null)
                  setProductUrl('')
                }}
                className="absolute top-2 right-2 p-1 text-white/50 hover:text-white transition-colors"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-semibold text-white mb-2">Product Information</h3>
              {productInfo.title && (
                <p className="text-white/90 font-medium mb-1">{productInfo.title}</p>
              )}
              {productInfo.description && (
                <p className="text-white/70 text-sm mb-1 line-clamp-2">{productInfo.description}</p>
              )}
              {productInfo.price && (
                <p className="text-[#3194d1] font-semibold">{productInfo.price}</p>
              )}
            </div>
          )}

          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Ad Style</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['modern', 'classic', 'bold', 'elegant'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                    style === s
                      ? 'bg-[#3194d1] text-white'
                      : 'bg-[#152042] text-white/70 hover:text-white hover:bg-[#2a3b75] border border-[#2a3b75]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateAd}
            disabled={loading || !productUrl.trim()}
            className="w-full px-4 py-3 bg-[#3194d1] text-white rounded-md hover:bg-[#267ab0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Ad...
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5" />
                Generate Promotional Ad
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Ads Gallery */}
      {generatedAds.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Generated Ads</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedAds.map((ad, index) => (
              <div
                key={index}
                className="bg-[#1e2d5f] p-4 rounded-xl border border-[#2a3b75] space-y-3"
              >
                <div className="relative aspect-video bg-[#152042] rounded-md overflow-hidden border border-[#2a3b75]">
                  <img
                    src={ad.adImageUrl}
                    alt={`Promotional ad ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/1200x628/4F46E5/FFFFFF?text=Ad+Image'
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70 capitalize">{ad.style} style</span>
                  <button
                    onClick={() =>
                      handleDownload(
                        ad.adImageUrl,
                        `promotional-ad-${ad.style}-${Date.now()}.png`
                      )
                    }
                    className="px-3 py-1 bg-[#2a3b75] text-white rounded-md hover:bg-[#3194d1]/20 transition-colors flex items-center gap-1 text-sm"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
                {ad.productInfo?.title && (
                  <p className="text-xs text-white/60 truncate">{ad.productInfo.title}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {generatedAds.length === 0 && !loading && (
        <div className="bg-[#1e2d5f] p-12 rounded-xl border border-[#2a3b75] text-center">
          <ImageIcon className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/70">No ads generated yet. Enter a product URL above to get started.</p>
        </div>
      )}
    </div>
  )
}

