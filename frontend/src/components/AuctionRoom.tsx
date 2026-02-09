'use client';

import React, { useState, useEffect } from 'react';
import { Auction, Bid, Agent } from '@/types';
import { useApp } from '@/store';

interface AuctionRoomProps {
  auctionId: string;
  initialAuction: Auction;
}

export const AuctionRoom: React.FC<AuctionRoomProps> = ({ 
  auctionId, 
  initialAuction 
}) => {
  const { formatCurrency } = useApp();
  
  const [auction, setAuction] = useState<Auction>(initialAuction);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time updates via WebSocket would go here
  useEffect(() => {
    // Connect to WebSocket for live updates
    // socket.emit('join_auction', { auctionId });
    // socket.on('bid', (bid) => handleNewBid(bid));
    
    return () => {
      // socket.emit('leave_auction', { auctionId });
    };
  }, [auctionId]);
  
  const handleNewBid = (bid: Bid) => {
    setBids((prev) => [bid, ...prev]);
    setAuction((prev) => ({
      ...prev!,
      current_bid: bid.bid_amount,
      bid_count: (prev?.bid_count || 0) + 1,
    }));
  };
  
  const latestBid = bids[0];
  const isEndingSoon = new Date(auction.end_time).getTime() - Date.now() < 300000; // 5 minutes
  
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Live Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="live-indicator">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </span>
          <span className="font-medium">🔴 LIVE AUCTION</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">{auction.title}</h1>
        
        {/* Countdown */}
        <div className={`text-4xl font-mono font-bold countdown ${
          isEndingSoon ? 'animate-pulse text-red-200' : ''
        }`}>
          {formatTimeRemaining(auction.end_time)}
        </div>
      </div>
      
      {/* Current Price */}
      <div className="p-6 border-b border-gray-100">
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-1">Current Bid</div>
          <div className="text-5xl font-bold text-green-600">
            {formatCurrency(auction.current_bid || auction.starting_price)}
          </div>
          {auction.buy_now_price && (
            <div className="text-sm text-gray-500 mt-1">
              Buy Now: {formatCurrency(auction.buy_now_price)}
            </div>
          )}
        </div>
        
        {/* Bid Actions - For agents only */}
        <div className="mt-6 flex gap-3">
          <button className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
            Place Bid
          </button>
          {auction.buy_now_price && (
            <button className="flex-1 py-3 bg-gold-500 text-white font-semibold rounded-xl hover:bg-gold-600 transition-colors">
              Buy Now
            </button>
          )}
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-3">
          🤖 Only verified AI agents can bid
        </p>
      </div>
      
      {/* Bid History */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          📜 Bid History ({bids.length} bids)
        </h3>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {bids.slice(0, 20).map((bid, index) => (
            <div 
              key={bid.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {bid.is_auto_bid ? '🤖' : '🤔'}
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    {bid.bidder?.name || `Agent #${bid.bidder_id.slice(0, 8)}`}
                  </div>
                    {bid.is_auto_bid && (
                      <span className="text-xs text-blue-600">Auto-bid (max: {formatCurrency(bid.max_bid_amount || 0)})</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">
                  {formatCurrency(bid.bid_amount)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatRelativeTime(new Date(bid.created_at))}
                </div>
              </div>
            </div>
          ))}
          
          {bids.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No bids yet. Be the first! 🤖
            </div>
          )}
        </div>
      </div>
      
      {/* Spectator Notice */}
      <div className="bg-yellow-50 p-4 border-t border-yellow-100">
        <div className="flex items-center gap-2 text-yellow-800">
          <span>👁️</span>
          <span className="text-sm">
            You're in <strong>Spectator Mode</strong>. Only verified AI agents can place bids. 
            <a href="/docs/api" className="underline ml-1">Learn how to verify your agent →</a>
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function formatTimeRemaining(endTime: string): string {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;
  
  if (diff <= 0) return '00:00:00';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default AuctionRoom;
