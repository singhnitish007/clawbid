import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { AuctionEngine } from '../services/auctionEngine.js';

interface ConnectedClient {
  socketId: string;
  agentId?: string;
  joinedRooms: Set<string>;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private clients: Map<string, ConnectedClient> = new Map();
  
  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
      pingInterval: 25000,
      pingTimeout: 20000,
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    // Start auction end checker
    setInterval(() => this.checkAuctionEndings(), 1000);
  }
  
  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const agentId = socket.handshake.auth.agentId;
        const apiKey = socket.handshake.auth.apiKey;
        
        if (agentId && apiKey) {
          // Agent connection - validate API key
          // In production, validate against database
          socket.agentId = agentId;
        }
        
        next();
      } catch (error) {
        next(error);
      }
    });
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      
      this.clients.set(clientId, {
        socketId: clientId,
        joinedRooms: new Set(),
      });
      
      logger.info(`Client connected: ${clientId}`);
      
      // Handle agent joining auction room
      socket.on('join_auction', async (data) => {
        const { auctionId } = data;
        
        if (!auctionId) {
          socket.emit('error', { message: 'auctionId required' });
          return;
        }
        
        socket.join(`auction:${auctionId}`);
        
        const client = this.clients.get(clientId);
        if (client) {
          client.joinedRooms.add(auctionId);
        }
        
        // Confirm join
        socket.emit('auction_joined', { auctionId });
        
        // Notify others
        socket.to(`auction:${auctionId}`).emit('spectator_joined', {
          auctionId,
          spectatorCount: this.getRoomCount(`auction:${auctionId}`) - 1,
        });
        
        logger.info(`Client ${clientId} joined auction ${auctionId}`);
      });
      
      // Handle leaving auction
      socket.on('leave_auction', (data) => {
        const { auctionId } = data;
        socket.leave(`auction:${auctionId}`);
        
        const client = this.clients.get(clientId);
        if (client) {
          client.joinedRooms.delete(auctionId);
        }
      });
      
      // Handle new bid (agent only)
      socket.on('place_bid', async (data) => {
        try {
          const { auctionId, amount, agentId, maxBid } = data;
          
          // Validate and place bid
          const auctionEngine = globalThis.auctionEngine || 
            new (await import('../services/auctionEngine.js')).AuctionEngine();
          
          const result = await auctionEngine.placeBid({
            auctionId,
            bidderId: agentId,
            bidAmount: amount,
            isAutoBid: !!maxBid,
            maxBidAmount: maxBid,
          });
          
          if (result.success) {
            // Broadcast new bid to all in room
            this.io.to(`auction:${auctionId}`).emit('bid_placed', {
              auctionId,
              bid: result.bid,
              newPrice: result.newPrice,
              bidCount: result.bidCount,
            });
            
            // Send confirmation to bidder
            socket.emit('bid_confirmed', {
              auctionId,
              bid: result.bid,
              newPrice: result.newPrice,
            });
            
            logger.info(`Bid placed on auction ${auctionId}: ${amount} by agent ${agentId}`);
          } else {
            socket.emit('bid_rejected', {
              auctionId,
              reason: result.error,
            });
          }
        } catch (error) {
          logger.error('Bid error:', error);
          socket.emit('bid_error', { message: 'Failed to place bid' });
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        this.clients.delete(clientId);
        logger.info(`Client disconnected: ${clientId}`);
      });
    });
  }
  
  private getRoomCount(room: string): number {
    const roomSocketIds = this.io.sockets.adapter.rooms.get(room);
    return roomSocketIds ? roomSocketIds.size : 0;
  }
  
  private async checkAuctionEndings() {
    const auctionEngine = globalThis.auctionEngine || 
      new (await import('../services/auctionEngine.js')).AuctionEngine();
    
    // Check for ended auctions
    const endedAuctions = await auctionEngine.checkEndedAuctions();
    
    for (const auction of endedAuctions) {
      // Notify all clients in room
      this.io.to(`auction:${auction.id}`).emit('auction_ended', {
        auctionId: auction.id,
        winnerId: auction.winnerId,
        finalPrice: auction.finalPrice,
      });
      
      logger.info(`Auction ${auction.id} ended. Winner: ${auction.winnerId}`);
    }
  }
  
  // Public method to broadcast to auction room
  broadcastToAuction(auctionId: string, event: string, data: any) {
    this.io.to(`auction:${auctionId}`).emit(event, data);
  }
  
  // Get connected clients count
  getClientCount(): number {
    return this.clients.size;
  }
  
  // Get auction spectator count
  getAuctionSpectators(auctionId: string): number {
    return this.getRoomCount(`auction:${auctionId}`);
  }
}

export default WebSocketManager;
