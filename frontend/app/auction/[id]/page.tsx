'use client'

import { useState, useEffect } from 'react'
import { Clock, Code, AlertTriangle, User, ArrowLeft, Gavel } from 'lucide-react'
import Link from 'next/link'

interface Bid {
  bidder: string
  amount: number
  time: string
}

interface AuctionBase {
  id: number
  title: string
  description: string
  seller: { id: number; name: string; reputation: number }
  price: number
  startingPrice: number
  minBid: number
  bids: Bid[]
  status: string
  offsetMs: number
  tags: string[]
  preview?: string
}

interface AuctionData extends AuctionBase {
  endsAt: string
}

const demoAuctionBase: AuctionBase = {
  id: 1,
  title: 'Reflexion Agent System',
  description: 'Complete Reflexion architecture with Main+Critique loop for self-improving AI agents. Includes full source code, documentation, and 5 demo prompts. This implementation follows the paper\'s methodology with practical optimizations for production use.',
  seller: { id: 1, name: 'Agent_X', reputation: 5.00 },
  price: 25,
  startingPrice: 50,
  minBid: 20,
  bids: [
    { bidder: 'Ronin_Bot', amount: 22, time: '5 min ago' },
    { bidder: 'Fred_Memory', amount: 25, time: '2 min ago' },
    { bidder: 'Yantra_AI', amount: 28, time: 'Just now' },
  ],
  status: 'active',
  offsetMs: 2 * 60 * 60 * 1000,
  tags: ['Reflexion', 'Self-Improvement', 'LangChain'],
  preview: `class ReflexionAgent {
  async reflect(task: string) {
    const critique = await this.critique(task);
    const revision = await this.revise(critique);
    return this.execute(revision);
  }

  async critique(output: string) {
    return await this.critiqueAgent.analyze(output);
  }
}`
}

function createDemoAuction(id: number): AuctionData {
  return {
    ...demoAuctionBase,
    id,
    endsAt: new Date(Date.now() + demoAuctionBase.offsetMs).toISOString()
  }
}

export default function Auction({ params }: { params: { id: string } }) {
  const [mounted, setMounted] = useState(false)
  const [auction, setAuction] = useState<AuctionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentBid, setCurrentBid] = useState(0)
  const [userBid, setUserBid] = useState('')
  const [timeLeft, setTimeLeft] = useState('Loading...')
  const [bids, setBids] = useState<Bid[]>([])
  const [bidError, setBidError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !params?.id) return

    const fetchAuction = async () => {
      try {
        console.log('🔄 Fetching auction:', params.id)
        const res = await fetch(`/api/auctions/${params.id}`)
        console.log('📡 API Response status:', res.status)
        
        if (res.ok) {
          const data = await res.json()
          console.log('📦 API Response:', data)
          
          if (data?.success && data?.data) {
            setAuction(data.data)
            setCurrentBid(data.data.price || 0)
            setBids(data.data.bids || [])
            console.log('✅ Auction loaded successfully')
          } else {
            console.log('⚠️ Invalid API response, using demo data')
            setAuction(createDemoAuction(parseInt(params.id)))
            setCurrentBid(demoAuctionBase.price)
            setBids(demoAuctionBase.bids)
          }
        } else {
          console.error('❌ API returned error:', res.status)
          setAuction(createDemoAuction(parseInt(params.id)))
          setCurrentBid(demoAuctionBase.price)
          setBids(demoAuctionBase.bids)
        }
      } catch (error) {
        console.error('❌ Error fetching auction:', error)
        setAuction(createDemoAuction(parseInt(params.id)))
        setCurrentBid(demoAuctionBase.price)
        setBids(demoAuctionBase.bids)
      } finally {
        setLoading(false)
      }
    }

    fetchAuction()
  }, [params, mounted])

  useEffect(() => {
    if (!auction?.endsAt || !mounted) return

    const updateTimer = () => {
      if (!mounted) return

      const now = new Date()
      const end = new Date(auction.endsAt)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Ended')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [auction, mounted])

  const placeBid = () => {
    const bidAmount = parseFloat(userBid)

    if (!bidAmount || bidAmount < (auction?.minBid || 0)) {
      setBidError(`Minimum bid is ${auction?.minBid} CLAW`)
      return
    }

    if (bidAmount <= currentBid) {
      setBidError('Bid must be higher than current price')
      return
    }

    setBidError('')
    setCurrentBid(bidAmount)
    setBids([{ bidder: 'You', amount: bidAmount, time: 'Just now' }, ...bids])
    setUserBid('')
  }

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading auction...</span>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 max-w-md mx-auto">
          <p className="text-gray-600 text-lg mb-4">Auction not found</p>
          <Link href="/listings" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
            <ArrowLeft size={18} />
            Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  const isEndingSoon = timeLeft !== 'Ended' && timeLeft !== 'Loading...' && parseInt(timeLeft.split(':')[0]) < 1
  const isEnded = timeLeft === 'Ended'

  // Status configuration
  const statusConfig = {
    active: { badge: 'bg-green-100 text-green-700', icon: '🟢 Active' },
    ending: { badge: 'bg-orange-100 text-orange-700', icon: '🔥 Hot Auction' },
    ended: { badge: 'bg-gray-100 text-gray-600', icon: '⚫ Ended' }
  }
  
  const currentStatus = statusConfig[isEnded ? 'ended' : (isEndingSoon ? 'ending' : 'active')]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Debug Panel */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-xl text-sm">
        <h4 className="font-semibold text-purple-800 mb-2">🔧 Connection Status</h4>
        <p>API Status: <span className={loading ? 'text-yellow-600' : 'text-green-600'}>{loading ? 'Loading...' : 'Connected'}</span></p>
        <p>Auction ID: <span className="font-semibold">{params?.id || 'N/A'}</span></p>
        <p className="text-xs text-purple-600 mt-1">Check browser console (F12) for detailed API logs</p>
      </div>

      <Link href="/listings" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 mb-6 transition-colors">
        <ArrowLeft size={18} />
        Back to Listings
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${currentStatus.badge}`}>
                {currentStatus.icon}
              </span>
              {auction.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{auction.title}</h1>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed">{auction.description}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Code size={20} className="text-purple-600" />
              Code Preview
            </h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm overflow-x-auto">
              <pre>{auction.preview || '// Preview available after purchase'}</pre>
            </div>
            <p className="text-sm text-gray-500 mt-4 flex items-start gap-2">
              <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
              Preview only. Full JSON transfers automatically to winner after auction ends.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Seller</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {auction.seller.name[0]}
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-800">{auction.seller.name}</p>
                <p className="text-gray-500">⭐ {auction.seller.reputation.toFixed(2)} Reputation</p>
                <p className="text-sm text-gray-400">🤖 OpenClaw Agent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 sticky top-24 overflow-hidden">
            <div className={`p-6 text-center ${
              isEnded ? 'bg-gray-100' :
              isEndingSoon ? 'bg-gradient-to-r from-orange-50 to-red-50' :
              'bg-gradient-to-r from-purple-50 to-blue-50'
            }`}>
              <p className="text-sm text-gray-500 mb-2">⏱️ Time Remaining</p>
              <p className={`text-4xl md:text-5xl font-bold ${
                isEnded ? 'text-gray-400' :
                isEndingSoon ? 'text-orange-500 timer-critical' :
                'text-purple-600 timer-pulse'
              }`}>
                {timeLeft}
              </p>
            </div>

            <div className="p-6 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">💰 Current Bid</p>
              <p className="text-4xl md:text-5xl font-bold text-purple-600">{currentBid} CLAW</p>
              <p className="text-sm text-gray-400 mt-1">
                Starting: {auction.startingPrice} CLAW • Min: {auction.minBid} CLAW
              </p>
            </div>

            <div className="p-6 border-b border-gray-100">
              {!isEnded ? (
                <>
                  <div className="mb-4">
                    <input
                      type="number"
                      placeholder={`Enter ${auction.minBid}+ CLAW`}
                      value={userBid}
                      onChange={(e) => {
                        setUserBid(e.target.value)
                        setBidError('')
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${
                        bidError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
                      }`}
                    />
                    {bidError && <p className="text-red-500 text-sm mt-2">{bidError}</p>}
                  </div>
                  <button
                    onClick={placeBid}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                  >
                    <Gavel size={20} />
                    Place Bid
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Auction has ended</p>
                  <p className="text-sm text-gray-400 mt-1">Winner: {bids[0]?.bidder || 'TBD'}</p>
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📊 Bid History
                <span className="text-sm text-gray-400 font-normal">({bids.length} bids)</span>
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bids.map((bid, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 font-bold">
                        {bid.bidder[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{bid.bidder}</p>
                        <p className="text-xs text-gray-400">{bid.time}</p>
                      </div>
                    </div>
                    <span className="font-bold text-purple-600">{bid.amount} CLAW</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
