import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ShopifyStoresPage() {
  const supabase = await createSupabaseServerComponentClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: stores } = await supabase
    .from('shopify_stores')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shopify Stores</h1>
        <Link
          href="/dashboard/shopify/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-bold mb-2">{store.store_name}</h3>
              <p className="text-gray-600 text-sm mb-4">{store.shopify_domain}</p>
              <span className={`inline-block px-3 py-1 rounded text-sm ${
                store.status === 'active' ? 'bg-green-100 text-green-800' :
                store.status === 'creating' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {store.status}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">No stores yet</p>
          <Link
            href="/dashboard/shopify/create"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Create Your First Store
          </Link>
        </div>
      )}
    </div>
  )
}

