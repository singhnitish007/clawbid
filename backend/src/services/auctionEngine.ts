import { Database } from '../db/index.js';
import { WebSocketManager } from '../websocket/index.js';
import { logger } from '../utils/logger.js';

interface PlaceBidParams {
  auctionId: string;
  bidderId: string;
  bidAmount: number;
  isAutoBid?: boolean;
  maxBidAmount?: number;
}

interface BidResult {
  success: boolean;
  bid?: any;
  newPrice?: number;
  bidCount?: number;
  error?: string;
}

export class AuctionEngine {
  private db: Database;
  private wsManager: WebSocketManager;
  
  constructor(db: Database, wsManager: WebSocketManager) {
    this.db = db;
    this.wsManager = wsManager;
    
    // Make globally accessible for WebSocket handler
    globalThis.auctionEngine = this;
  }
  
  async placeBid(params: PlaceBidParams): Promise<BidResult> {
    const { auctionId, bidderId, bidAmount, isAutoBid = false, maxBidAmount } = params;
    
    try {
      // Get auction
      const auction = await this.db.query(
        `SELECT * FROM auctions WHERE id = $1 FOR UPDATE`,
        [auctionId]
      );
      
      if (!auction || auction.length === 0) {
        return { success: false, error: 'Auction not found' };
      }
      
      const currentAuction = auction[0];
      
      // Validate auction status
      if (currentAuction.status !== 'active') {
        return { success: false, error: 'Auction is not active' };
      }
      
      // Check if ended
      if (new Date(currentAuction.end_time) <= new Date()) {
        return { success: false, error: 'Auction has ended' };
      }
      
      // Validate bid amount
      const minBid = (currentAuction.current_bid || currentAuction.starting_price) + 
                   currentAuction.min_bid_increment;
      
      if (bidAmount < minBid) {
        return { 
          success: false, 
          error: `Bid must be at least ${minBid.toFixed(2)}` 
        };
      }
      
      // Check buy now price
      if (currentAuction.buy_now_price && bidAmount >= currentAuction.buy_now_price) {
        // Instant buy
        await this.endAuction(auctionId, bidderId, currentAuction.buy_now_price);
        
        return {
          success: true,
          bid: {
            id: crypto.randomUUID(),
            auction_id: auctionId,
            bidder_id: bidderId,
            bid_amount: currentAuction.buy_now_price,
            bid_number: currentAuction.bid_count + 1,
            is_auto_bid: false,
            created_at: new Date().toISOString(),
          },
          newPrice: currentAuction.buy_now_price,
          bidCount: currentAuction.bid_count + 1,
        };
      }
      
      // Place bid
      const bidNumber = currentAuction.bid_count + 1;
      
      const result = await this.db.query(
        `INSERT INTO bids (auction_id, bidder_id, bid_amount, bid_number, is_auto_bid, max_bid_amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [auctionId, bidderId, bidAmount, bidNumber, isAutoBid, maxBidAmount || null]
      );
      
      const newBid = result[0];
      
      // Update auction
      await this.db.query(
        `UPDATE auctions 
         SET current_bid = $1, bid_count = bid_count + 1, updated_at = NOW()
         WHERE id = $2`,
        [bidAmount, auctionId]
      );
      
      // Record transaction for bidder's wallet
      const newBidCount = currentAuction.bid_count + 1;
      
      logger.info(`Bid placed: ${bidAmount} on auction ${auctionId} by agent ${bidderId}`);
      
      return {
        success: true,
        bid: newBid,
        newPrice: bidAmount,
        bidCount: newBidCount,
      };
      
    } catch (error) {
      logger.error('Error placing bid:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to place bid' 
      };
    }
  }
  
  async checkEndedAuctions() {
    try {
      const result = await this.db.query(
        `SELECT id, seller_id, final_price, winner_id, bid_count
         FROM auctions 
         WHERE status = 'active' 
         AND end_time <= NOW()`,
        []
      );
      
      const endedAuctions = [];
      
      for (const auction of result) {
        if (auction.bid_count > 0) {
          // Get highest bidder
          const highestBid = await this.db.query(
            `SELECT bidder_id, bid_amount 
             FROM bids 
             WHERE auction_id = $1 
             ORDER BY bid_amount DESC 
             LIMIT 1`,
            [auction.id]
          );
          
          if (highestBid.length > 0) {
            await this.endAuction(
              auction.id, 
              highestBid[0].bidder_id, 
              highestBid[0].bid_amount
            );
            
            endedAuctions.push({
              id: auction.id,
              winnerId: highestBid[0].bidder_id,
              finalPrice: highestBid[0].bid_amount,
            });
          }
        } else {
          // No bids - mark as ended with no sale
          await this.db.query(
            `UPDATE auctions SET status = 'ended', updated_at = NOW() WHERE id = $1`,
            [auction.id]
          );
          
          endedAuctions.push({
            id: auction.id,
            winnerId: null,
            finalPrice: null,
          });
        }
      }
      
      return endedAuctions;
      
    } catch (error) {
      logger.error('Error checking ended auctions:', error);
      return [];
    }
  }
  
  async endAuction(auctionId: string, winnerId: string, finalPrice: number) {
    try {
      // Update auction status
      await this.db.query(
        `UPDATE auctions 
         SET status = 'sold', winner_id = $1, final_price = $2, updated_at = NOW()
         WHERE id = $3`,
        [winnerId, finalPrice, auctionId]
      );
      
      // Record in history
      await this.db.query(
        `INSERT INTO auction_history (auction_id, event_type, event_data)
         VALUES ($1, 'sold', $2)`,
        [auctionId, JSON.stringify({ winnerId, finalPrice })]
      );
      
      logger.info(`Auction ${auctionId} sold to ${winnerId} for ${finalPrice}`);
      
    } catch (error) {
      logger.error('Error ending auction:', error);
    }
  }
  
  async createAuction(params: {
    sellerId: string;
    title: string;
    description: string;
    listingType: string;
    category: string;
    tags: string[];
    startingPrice: number;
    minBidIncrement: number;
    buyNowPrice?: number;
    durationDays: number;
  }) {
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + params.durationDays);
    
    const result = await this.db.query(
      `INSERT INTO auctions (
        seller_id, title, description, listing_type, category, tags,
        starting_price, min_bid_increment, buy_now_price, end_time, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
      RETURNING *`,
      [
        params.sellerId,
        params.title,
        params.description,
        params.listingType,
        params.category,
        JSON.stringify(params.tags),
        params.startingPrice,
        params.minBidIncrement,
        params.buyNowPrice || null,
        endTime,
      ]
    );
    
    return result[0];
  }
  
  async getAuction(auctionId: string) {
    const result = await this.db.query(
      `SELECT a.*, s.name as seller_name, s.reputation_score as seller_reputation
       FROM auctions a
       JOIN agents s ON a.seller_id = s.id
       WHERE a.id = $1`,
      [auctionId]
    );
    
    return result[0];
  }
  
  async getAuctions(filters: {
    status?: string;
    listing_type?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    page?: number;
    limit?: number;
  }) {
    let query = `
      SELECT a.*, s.name as seller_name, s.reputation_score as seller_reputation,
             (SELECT MAX(bid_amount) FROM bids b WHERE b.auction_id = a.id) as current_bid,
             (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id) as bid_count
      FROM auctions a
      JOIN agents s ON a.seller_id = s.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters.status) {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(filters.status);
    }
    
    if (filters.listing_type) {
      query += ` AND a.listing_type = $${paramIndex++}`;
      params.push(filters.listing_type);
    }
    
    if (filters.category) {
      query += ` AND a.category = $${paramIndex++}`;
      params.push(filters.category);
    }
    
    if (filters.min_price) {
      query += ` AND a.starting_price >= $${paramIndex++}`;
      params.push(filters.min_price);
    }
    
    if (filters.max_price) {
      query += ` AND a.starting_price <= $${paramIndex++}`;
      params.push(filters.max_price);
    }
    
    // Sorting
    switch (filters.sort_by) {
      case 'ending_soon':
        query += ' ORDER BY a.end_time ASC';
        break;
      case 'price_low':
        query += ' ORDER BY a.starting_price ASC';
        break;
      case 'price_high':
        query += ' ORDER BY a.starting_price DESC';
        break;
      case 'most_bids':
        query += ' ORDER BY bid_count DESC';
        break;
      default:
        query += ' ORDER BY a.created_at DESC';
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);
    
    const result = await this.db.query(query, params);
    
    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(*) as total FROM auctions a WHERE 1=1` + 
        (filters.status ? ` AND a.status = '${filters.status}'` : ''),
      []
    );
    
    return {
      data: result,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0]?.total || '0'),
        total_pages: Math.ceil(parseInt(countResult[0]?.total || '0') / limit),
      },
    };
  }
}

export default AuctionEngine;
