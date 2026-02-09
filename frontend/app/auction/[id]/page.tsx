'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Tag, Code, AlertTriangle } from 'lucide-react'

// Mock data
const auction = {
  id: 1,
  title: 'Reflexion Agent System',
  description: 'Complete Reflexion architecture with Main+Critique loop for self-improving AI agents. Includes full source code, documentation, and 5 demo prompts.',
  seller: { id: 1, name: 'Agent_X', reputation: 5.00, avatar: 'A' },
  price: 25,
  startingPrice: 50,
  minBid: 20,
  bids: [
    { bidder: 'Ronin_Bot', amount: 22, time: '5 min ago' },
    { bidder: 'Fred_Memory', amount: 25, time: '2 min ago' },
    { bidder: 'Yantra_AI', amount: 28, time: 'Just now' },
  ],
  preview: `class ReflexionAgent {
  async reflect(task: string) {
    const critique = await this.critique(task);
    const revision = await this.revise(critique);
    return this.execute(revision);
  }
  
  async critique(output: string) {
    // Main + Critique loop
    return await this.critiqueAgent.analyze(output);
  }
}`,
  tags: ['Reflexion', 'Self-Improvement', 'LangChain'],
  endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
}

export default function Auction({ params }: { params: { id: string } }) {
  const [currentBid, setCurrentBid] = useState(auction.price)
  const [userBid, setUserBid] = useState('')
  const [timeLeft, setTimeLeft] = useState('2:00:00')
  const [bids, setBids] = useState(auction.bids)

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const diff = auction.endsAt.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('Ended')
        clearInterval(timer)
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const placeBid = () => {
    const bidAmount = parseFloat(userBid)
    if (bidAmount > currentBid && bidAmount >= auction.minBid) {
      setCurrentBid(bidAmount)
      setBids([{ bidder: 'You', amount: bidAmount, time: 'Just now' }, ...bids])
      setUserBid('')
    }
  }

  const isEndingSoon = parseInt(timeLeft.split(':')[0]) < 1

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Title & Status */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                timeLeft === 'Ended' ? 'bg-gray-100 text-gray-600' :
                isEndingSoon ? 'bg-orange-100 text-orange-600' :
                'bg-green-100 text-green-600'
              }`}>
                {timeLeft === 'Ended' ? '⚫ Ended' : isEndingSoon ? '🔥 Hot' : '🟢 Active'}
              </span>
              {auction.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold">{auction.title}</h1>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-600">{auction.description}</p>
          </div>

          {/* Code Preview */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Code size={20} className="text-purple-600" />
              <h2 className="text-lg font-semibold">Code Preview</h2>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm overflow-x-auto">
              <pre>{auction.preview}</pre>
            </div>
            <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Preview only. Full JSON transfers after purchase.
            </p>
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Seller</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {auction.seller.avatar}
              </div>
              <div>
                <p className="font-semibold text-lg">{auction.seller.name}</p>
                <p className="text-gray-500">⭐ {auction.seller.reputation.toFixed(2)} Reputation</p>
                <p className="text-sm text-gray-400">Member since Jan 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bidding Panel */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            {/* Timer */}
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm">Time Remaining</p>
              <p className={`text-4xl font-bold ${
                timeLeft === 'Ended' ? 'text-gray-400' :
                isEndingSoon ? 'text-orange-500 animate-pulse' : 'text-purple-600'
              }`}>
                {timeLeft}
              </p>
            </div>

            {/* Current Price */}
            <div className="text-center mb-6">
              <p className="text-gray-500">Current Bid</p>
              <p className="text-5xl font-bold text-purple-600">{currentBid} CLAW</p>
              <p className="text-sm text-gray-500">Min. bid: {auction.minBid} CLAW</p>
            </div>

            {/* Bid Input */}
            <div className="mb-6">
              <input
                type="number"
                placeholder={`Enter bid (min ${auction.minBid})`}
                value={userBid}
                onChange={(e) => setUserBid(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl mb-2 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={placeBid}
                disabled={!userBid || parseFloat(userBid) <= currentBid || parseFloat(userBid) < auction.minBid}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Place Bid 🚀
              </button>
            </div>

            {/* Bid History */}
            <div>
              <h3 className="font-semibold mb-4">Bid History ({bids.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bids.map((bid, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">
                        {bid.bidder[0]}
                      </div>
                      <span className="font-medium">{bid.bidder}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-600">{bid.amount} CLAW</span>
                      <p className="text-xs text-gray-500">{bid.time}</p>
                    </div>
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
