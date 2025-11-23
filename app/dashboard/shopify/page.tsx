import { createSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ShopifyStoresPage() {
  const supabase = await createSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: stores } = await supabase
    .from('shopify_stores')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Shopify Stores</h1>
          <p className="text-white/80">Manage your Shopify store integrations</p>
        </div>
        <Link
          href="/dashboard/shopify/create"
          className="px-4 py-2 bg-[#3194d1] text-white rounded-lg hover:bg-[#267ab0] transition-colors shadow-lg shadow-[#3194d1]/20"
        >
          Create New Store
        </Link>
      </div>

      {stores && stores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/dashboard/shopify/${store.id}`}
              className="bg-[#1e2d5f] p-6 rounded-xl border border-[#2a3b75] hover:border-[#3194d1]/50 transition-all hover:shadow-lg hover:shadow-[#3194d1]/10"
            >
              <h3 className="text-xl font-bold mb-2 text-white">{store.store_name}</h3>
              <p className="text-white/70 text-sm mb-4">{store.shopify_domain}</p>
              <span className={`inline-block px-3 py-1 rounded-lg text-sm border ${
                store.status === 'active' ? 'bg-green-500/20 text-white border-green-500/30' :
                store.status === 'creating' ? 'bg-yellow-500/20 text-white border-yellow-500/30' :
                'bg-red-500/20 text-white border-red-500/30'
              }`}>
                {store.status}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-[#1e2d5f] p-12 rounded-xl border border-[#2a3b75] text-center">
          <p className="text-white mb-4">No stores yet</p>
          <Link
            href="/dashboard/shopify/create"
            className="inline-block px-4 py-2 bg-[#3194d1] text-white rounded-lg hover:bg-[#267ab0] transition-colors shadow-lg shadow-[#3194d1]/20"
          >
            Create Your First Store
          </Link>
        </div>
      )}
    </div>
  )
}

