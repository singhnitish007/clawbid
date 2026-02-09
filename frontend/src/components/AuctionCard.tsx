'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Auction } from '@/types';
import { useApp } from '@/store';

interface AuctionCardProps {
  auction: Auction;
  showLive?: boolean;
  compact?: boolean;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ 
  auction, 
  showLive = false,
  compact = false 
}) => {
  const { formatCurrency, formatTimeRemaining } = useApp();
  
  const timeRemaining = formatTimeRemaining(new Date(auction.end_time));
  const isEndingSoon = new Date(auction.end_time).getTime() - Date.now() < 3600000; // 1 hour
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    ended: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    sold: 'bg-purple-100 text-purple-800',
  };

  return (
    <Link 
      href={`/auction/${auction.id}`}
      className={`auction-card block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Image */}
      <div className={`relative ${compact ? 'h-32' : 'h-48'} rounded-lg overflow-hidden bg-gray-100`}>
        {auction.preview_images?.[0] ? (
          <Image
            src={auction.preview_images[0]}
            alt={auction.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            {auction.listing_type === 'skill' && '⚙️'}
            {auction.listing_type === 'prompt' && '📝'}
            {auction.listing_type === 'dataset' && '📊'}
            {auction.listing_type === 'template' && '📋'}
            {auction.listing_type === 'workflow' && '🔄'}
          </div>
        )}
        
        {/* Live indicator */}
        {showLive && auction.status === 'active' && (
          <div className="absolute top-2 left-2">
            <span className="live-indicator px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              🔴 LIVE
            </span>
          </div>
        )}
        
        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full capitalize">
            {auction.listing_type}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className={compact ? 'mt-2' : 'mt-4'}>
        {/* Title */}
        <h3 className={`font-semibold text-gray-900 line-clamp-1 ${compact ? 'text-sm' : 'text-lg'}`}>
          {auction.title}
        </h3>
        
        {/* Seller */}
        {auction.seller && (
          <div className="flex items-center gap-2 mt-1">
            <span className={`agent-badge agent-badge-verified ${compact ? 'text-xs' : ''}`}>
              🤖 {auction.seller.name}
            </span>
          </div>
        )}
        
        {/* Price & Timer */}
        <div className={`flex items-center justify-between mt-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          <div>
            {auction.current_bid ? (
              <div>
                <span className="text-gray-500 line-through text-xs">
                  {formatCurrency(auction.starting_price)}
                </span>
                <div className="font-bold text-green-600">
                  {formatCurrency(auction.current_bid)}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                Starting: {formatCurrency(auction.starting_price)}
              </div>
            )}
          </div>
          
          <div className={`text-right ${isEndingSoon ? 'text-red-600' : 'text-gray-500'}`}>
            <div className="font-mono font-bold countdown">
              {timeRemaining}
            </div>
            <div className="text-xs">remaining</div>
          </div>
        </div>
        
        {/* Bid count */}
        {auction.bid_count > 0 && (
          <div className={`flex items-center gap-1 mt-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            <span>💰</span>
            <span className="text-gray-600">
              {auction.bid_count} bids
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default AuctionCard;
