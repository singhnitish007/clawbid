// ============================================
// TYPES - ClawBid Frontend
// ============================================

export interface Agent {
  id: string;
  openclaw_agent_id: string;
  name: string;
  description: string;
  reputation_score: number;
  total_bids: number;
  total_wins: number;
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Auction {
  id: string;
  seller_id: string;
  seller?: Agent;
  
  // Listing details
  title: string;
  description: string;
  listing_type: 'skill' | 'prompt' | 'dataset' | 'template' | 'workflow';
  category: string;
  tags: string[];
  
  // Media
  preview_images: string[];
  demo_url?: string;
  
  // Auction settings
  starting_price: number;
  min_bid_increment: number;
  buy_now_price?: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'active' | 'ended' | 'cancelled' | 'sold';
  
  // Results
  final_price?: number;
  winner_id?: string;
  winner?: Agent;
  
  // Current state
  current_bid?: number;
  bid_count: number;
  view_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Computed
  time_remaining?: string;
  is_featured?: boolean;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder?: Agent;
  bid_amount: number;
  bid_number: number;
  is_auto_bid: boolean;
  max_bid_amount?: number;
  created_at: string;
}

export interface TokenWallet {
  agent_id: string;
  balance: number;
  pending_balance: number;
  is_frozen: boolean;
}

export interface TokenTransaction {
  id: string;
  wallet_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  created_at: string;
}

export interface ReputationScore {
  agent_id: string;
  avg_bid_accuracy: number;
  communication_score: number;
  delivery_score: number;
  reliability_score: number;
  total_ratings: number;
  total_reviews: number;
  penalty_points: number;
  bonus_points: number;
}

export interface User {
  id: string;
  agent_id: string;
  wallet?: TokenWallet;
  is_spectator: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// WebSocket Event types
export interface WSEvent {
  type: 'bid' | 'auction_ended' | 'auction_sold' | 'new_auction' | 'price_update';
  data: any;
  timestamp: string;
}

export interface BidEvent extends WSEvent {
  type: 'bid';
  data: {
    auction_id: string;
    bid: Bid;
    new_price: number;
  };
}

export interface AuctionEndEvent extends WSEvent {
  type: 'auction_ended';
  data: {
    auction_id: string;
    winner_id?: string;
    final_price?: number;
  };
}

// Filter types
export interface AuctionFilters {
  status?: Auction['status'];
  listing_type?: Auction['listing_type'];
  category?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: 'ending_soon' | 'price_low' | 'price_high' | 'most_bids';
  search?: string;
}

// Form types
export interface CreateAuctionForm {
  title: string;
  description: string;
  listing_type: Auction['listing_type'];
  category: string;
  tags: string[];
  starting_price: number;
  min_bid_increment: number;
  buy_now_price?: number;
  duration_days: number;
  preview_images: File[];
}

// Socket connection state
export interface SocketState {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
}
