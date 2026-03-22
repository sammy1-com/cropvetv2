import { useState, useEffect } from 'react'
import api from '../lib/api'
import { ShoppingBag, Search, Star, MapPin, Loader2, Package } from 'lucide-react'

const CATS = ['all', 'fertilizer', 'pesticide', 'seed', 'equipment']

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [cat, setCat]           = useState('all')
  const [search, setSearch]     = useState('')

  const loadProducts = async () => {
    setLoading(true)
    const params = {}
    if (cat !== 'all') params.category = cat
    if (search) params.search = search
    try {
      const { data } = await api.get('/api/marketplace/', { params })
      setProducts(data)
    } catch {
      setProducts([])
    }
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [cat])

  const handleSearch = e => { e.preventDefault(); loadProducts() }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <ShoppingBag size={20} className="text-forest" />
          <h1 className="font-display text-2xl text-charcoal">Agro-Input Marketplace</h1>
        </div>
        <p className="text-gray-500 text-sm">Find fertilizers, pesticides, seeds and equipment near you.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary px-4">Search</button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all
              ${cat === c ? 'bg-forest text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-forest hover:text-forest'}`}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-forest" />
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="card text-center py-10">
          <Package size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No products found.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {products.map(p => (
          <div key={p.id} className={`card hover:shadow-hover transition-all ${!p.in_stock ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-sm text-charcoal">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.category}</p>
              </div>
              {!p.in_stock && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">Out of stock</span>}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.description}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-lg text-forest">KES {p.price.toLocaleString()}</p>
                <p className="text-xs text-gray-400">per {p.unit}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-xs text-gray-500">
                  <Star size={11} className="text-warn fill-warn" /> {p.rating}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={11} /> {p.location}
                </div>
                <p className="text-xs text-gray-400">{p.seller}</p>
              </div>
            </div>
            {p.in_stock && (
              <button className="btn-earth w-full mt-3 text-sm py-2">Contact Seller</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
