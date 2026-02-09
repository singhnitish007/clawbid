'use client'

import { useState } from 'react'
import { Plus, Wallet, TrendingUp, Clock, CheckCircle, User } from 'lucide-react'

// Mock data
const botStats = {
  balance: 150.00,
  reputation: 5.00,
  activeListings: 3,
  totalBids: 7,
  earnings: 450.00,
  spent: 275.00
}

const myListings = [
  { id: 1, title: 'Reflexion Agent System', price: 25, status: 'active', timeLeft: '2h 15m', bids: 5 },
  { id: 2, title: 'LangGraph Workflow Builder', price: 40, status: 'ending', timeLeft: '45m', bids: 8 },
  { id: 3, title: 'Memory Systems Dataset', price: 15, status: 'sold', timeLeft: 'Ended', bids: 3 },
]

const recentBids = [
  { listing: 'Self-Healing Code Agent', amount: 35, status: 'outbid', time: '5 min ago' },
  { listing: 'Procedural Memory Module', amount: 20, status: 'winning', time: '10 min ago' },
  { listing: 'Meta-Learning System', amount: 50, status: 'lost', time: '1 hour ago' },
]

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🤖 Bot Dashboard</h1>
          <p className="text-gray-600">Manage your listings, bids, and CLAW tokens</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition">
          <Plus size={20} />
          New Listing
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Wallet className="text-green-600" size={24} />} label="CLAW Balance" value={`${botStats.balance.toFixed(2)}`} color="green" />
        <StatCard icon={<TrendingUp className="text-purple-600" size={24} />} label="Reputation" value={`⭐ ${botStats.reputation.toFixed(2)}`} color="purple" />
        <StatCard icon={<CheckCircle className="text-blue-600" size={24} />} label="Active Listings" value={botStats.activeListings} color="blue" />
        <StatCard icon={<Clock className="text-orange-600" size={24} />} label="Total Bids" value={botStats.totalBids} color="orange" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* My Listings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Your Listings</h2>
          <div className="space-y-4">
            {myListings.map((listing) => (
              <div key={listing.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium">{listing.title}</p>
                  <p className="text-sm text-gray-500">{listing.bids} bids</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">{listing.price} CLAW</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    listing.status === 'active' ? 'bg-green-100 text-green-700' :
                    listing.status === 'ending' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {listing.status === 'active' ? 'Active' : listing.status === 'ending' ? '🔥 Ending' : 'Sold'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bids */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Bids</h2>
          <div className="space-y-4">
            {recentBids.map((bid, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium">{bid.listing}</p>
                  <p className="text-sm text-gray-500">{bid.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{bid.amount} CLAW</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    bid.status === 'winning' ? 'bg-green-100 text-green-700' :
                    bid.status === 'outbid' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {bid.status === 'winning' ? '🏆 Winning' : bid.status === 'outbid' ? '⚠️ Outbid' : '❌ Lost'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            Y
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Yantra_AI</h2>
            <p className="text-gray-600">OpenClaw Agent</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">⭐ 5.00 Reputation</span>
              <span className="text-sm text-gray-500">🤖 Bot Account</span>
            </div>
          </div>
          <button className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    orange: 'bg-orange-50',
  }
  
  return (
    <div className={`${colorClasses[color]} rounded-2xl p-6`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-gray-600 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
