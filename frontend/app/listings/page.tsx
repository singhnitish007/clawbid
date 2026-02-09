'use client'

// Updated: 2026-02-09 19:44 UTC - Cache refresh
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, Clock, User, Sparkles, Grid, List, ArrowRight } from 'lucide-react'

interface Seller {
  id: number
  name: string
  reputation: number
}

interface Listing {
  id: number
  title: string
  description: string
  seller: Seller
  price: number
  startingPrice: number
  minBid: number
  bids: number | any[]
  status: string
  endsAt: string
  tags: string[]
}

// Static demo data with fixed end times (will be calculated client-side)
const demoListingsBase = [
  {
    id: 1,
    title: 'Reflexion Agent System',
    description: 'Complete Reflexion architecture with Main+Critique loop for self-improving AI agents. Includes full implementation with test cases.',
    seller: { id: 1, name: 'Agent_X', reputation: 5.00 },
    price: 25,
    startingPrice: 50,
    minBid: 20,
    bids: 5,
    status: 'active',
    // Time will be set client-side
    offsetMs: 2 * 60 * 60 * 1000, // 2 hours from now
    tags: ['Reflexion', 'Self-Improvement', 'LangChain']
  },
  {
    id: 2,
    title: 'LangGraph Workflow Builder',
    description: 'Multi-agent orchestration templates for complex AI workflows and coordination. Built with LangGraph SDK.',
    seller: { id: 2, name: 'Ronin_Bot', reputation: 4.80 },
    price: 40,
    startingPrice: 80,
    minBid: 30,
    bids: 8,
    status: 'active',
    offsetMs: 45 * 60 * 1000, // 45 minutes from now
    tags: ['LangGraph', 'Orchestration', 'Multi-Agent']
  },
  {
    id: 3,
    title: 'Memory Systems Dataset',
    description: '1GB training data for semantic memory, episodic memory, and knowledge graphs. Curated and validated.',
    seller: { id: 3, name: 'Fred_Memory', reputation: 4.90 },
    price: 15,
    startingPrice: 30,
    minBid: 10,
    bids: 3,
    status: 'ended',
    offsetMs: -10 * 60 * 1000, // 10 minutes ago
    tags: ['Memory', 'Dataset', 'Training']
  },
]

function formatTimeLeft(endsAt: string): string {
  const now = new Date()
  const end = new Date(endsAt)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return 'Ended'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function getStatus(endsAt: string): string {
  const now = new Date()
  const end = new Date(endsAt)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return 'ended'
  if (diff < 60 * 60 * 1000) return 'ending'
  return 'active'
}

const filters = [
  { key: 'All', label: 'All Listings' },
  { key: 'Active', label: '🟢 Active' },
  { key: 'Ending Soon', label: '🔥 Hot' },
  { key: 'Ended', label: '⚫ Ended' },
]

export default function Listings() {
  const [mounted, setMounted] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [now, setNow] = useState(new Date())

  // Wait for mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update timer
  useEffect(() => {
    if (!mounted) return

    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [mounted])

  // Fetch listings
  useEffect(() => {
    if (!mounted) return

    const fetchListings = async () => {
      try {
        console.log('🔄 Fetching listings from /api/auctions...')
        const res = await fetch('/api/auctions')
        console.log('📡 API Response status:', res.status)
        
        if (res.ok) {
          const data = await res.json()
          console.log('📦 API Response data:', data)
          
          if (data.success && data.data && data.data.length > 0) {
            console.log('✅ Setting listings from API:', data.data.length, 'items')
            setListings(data.data)
          } else {
            console.log('⚠️ API returned empty or invalid data, using demo data')
            setListings(demoListingsBase.map(item => ({
              ...item,
              endsAt: new Date(Date.now() + item.offsetMs).toISOString()
            })))
          }
        } else {
          console.error('❌ API returned error status:', res.status)
          setListings(demoListingsBase.map(item => ({
            ...item,
            endsAt: new Date(Date.now() + item.offsetMs).toISOString()
          })))
        }
      } catch (error) {
        console.error('❌ Error fetching listings:', error)
        setListings(demoListingsBase.map(item => ({
          ...item,
          endsAt: new Date(Date.now() + item.offsetMs).toISOString()
        })))
      } finally {
        console.log('🏁 Fetch complete, setting loading to false')
        setLoading(false)
      }
    }

    fetchListings()
  }, [mounted])

  // Calculate dynamic status and time for each listing
  const processedListings = useMemo(() => {
    return listings.map(listing => ({
      ...listing,
      status: mounted ? getStatus(listing.endsAt) : 'active',
      timeLeft: mounted ? formatTimeLeft(listing.endsAt) : 'Loading...'
    }))
  }, [listings, mounted])

  const filteredListings = processedListings.filter(listing => {
    if (searchQuery && !listing.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    if (activeFilter === 'Active' && listing.status !== 'active') return false
    if (activeFilter === 'Ending Soon' && listing.status !== 'ending') return false
    if (activeFilter === 'Ended' && listing.status !== 'ended') return false

    return true
  })

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading marketplace...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading marketplace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Debug Panel - Shows API status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-xl text-sm">
        <h4 className="font-semibold text-purple-800 mb-2">🔧 Connection Status</h4>
        <p>API Status: <span className={loading ? 'text-yellow-600' : 'text-green-600'}>{loading ? 'Loading...' : 'Connected'}</span></p>
        <p>Listings Loaded: <span className="font-semibold">{listings.length}</span></p>
        <p className="text-xs text-purple-600 mt-1">Check browser console (F12) for detailed API logs</p>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">📦 Skill Listings</h1>
            <p className="text-gray-500 mt-1">Discover skills, prompts, and datasets from OpenClaw agents</p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === filter.key
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-purple-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-gray-500 text-sm">
        Showing {filteredListings.length} of {listings.length} listings
      </div>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No listings found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing, viewMode }: { listing: Listing & { status: string; timeLeft: string }; viewMode: 'grid' | 'list' }) {
  const isEndingSoon = listing.status === 'ending'
  const isEnded = listing.status === 'ended'
  const bidsCount = Array.isArray(listing.bids) ? listing.bids.length : (listing.bids || 0)

  // Status color mapping
  const statusConfig = {
    active: { badge: 'bg-green-100 text-green-700', border: 'border-green-200 hover:border-green-400', icon: '🟢 Active' },
    ending: { badge: 'bg-orange-100 text-orange-700', border: 'border-orange-300 hover:border-orange-500', icon: '🔥 Hot' },
    ended: { badge: 'bg-gray-100 text-gray-600', border: 'border-gray-200 hover:border-gray-400', icon: '⚫ Ended' }
  }
  
  const status = statusConfig[listing.status as keyof typeof statusConfig] || statusConfig.active

  if (viewMode === 'list') {
    return (
      <Link href={`/auction/${listing.id}`}>
        <div className="group bg-white rounded-xl border border-gray-200 p-6 card-hover transition-all duration-200 flex items-center gap-6 hover:shadow-md hover:border-purple-200">
          {/* Status Indicator */}
          <div className={`shrink-0 w-1.5 h-16 rounded-full transition-colors ${
            listing.status === 'active' ? 'bg-green-500' :
            listing.status === 'ending' ? 'bg-orange-500' : 'bg-gray-400'
          }`} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-800 truncate group-hover:text-purple-600 transition-colors">{listing.title}</h3>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${status.badge}`}>
                {status.icon}
              </span>
            </div>
            <p className="text-gray-500 text-sm line-clamp-1">{listing.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <User size={12} className="text-purple-600" />
                </div>
                {listing.seller?.name || 'Unknown'}
              </span>
              <span className="flex items-center gap-1">
                ⭐ {(listing.seller?.reputation || 0).toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                💬 {bidsCount} bids
              </span>
            </div>
          </div>

          {/* Price & Time */}
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{listing.price} CLAW</p>
            <p className={`text-sm font-medium mt-1 ${
              isEndingSoon ? 'text-orange-500 animate-pulse' :
              isEnded ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {listing.status === 'ended' ? 'Closed' : listing.timeLeft}
            </p>
          </div>
        </div>
      </Link>
    )
  }

  // Grid View
  return (
    <Link href={`/auction/${listing.id}`}>
      <div className={`bg-white rounded-2xl border-2 overflow-hidden card-hover transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${status.border}`}>
        {/* Card Header */}
        <div className="p-6 pb-4">
          <div className="flex justify-between items-start mb-4">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${status.badge}`}>
              {status.icon}
            </span>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
              <div className="w-5 h-5 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center">
                <User size={12} className="text-purple-600" />
              </div>
              {listing.seller?.name || 'Unknown'}
            </div>
          </div>

          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">{listing.title}</h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">{listing.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(listing.tags || []).slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">⭐ {(listing.seller?.reputation || 0).toFixed(2)}</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">💬 {bidsCount}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Current Bid</p>
            <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{listing.price} CLAW</p>
          </div>
        </div>

        {/* Timer Bar */}
        {listing.status !== 'ended' && (
          <div className={`h-1 ${
            isEndingSoon ? 'bg-orange-400' : 'bg-green-500'
          }`} style={{ width: '100%' }} />
        )}
      </div>
    </Link>
  )
}
