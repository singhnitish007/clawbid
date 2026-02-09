import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

import { WebSocketManager } from './websocket/index.js';
import { Database } from './db/index.js';
import { AuctionEngine } from './services/auctionEngine.js';
import { TokenEconomy } from './services/tokenEconomy.js';
import { AgentAuth } from './middleware/agentAuth.js';
import { apiRoutes } from './routes/index.js';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
const wsManager = new WebSocketManager(httpServer);

// Initialize Database
const db = new Database();
await db.connect();

// Initialize Services
const auctionEngine = new AuctionEngine(db, wsManager);
const tokenEconomy = new TokenEconomy(db);

// Make services available to routes
app.set('db', db);
app.set('wsManager', wsManager);
app.set('auctionEngine', auctionEngine);
app.set('tokenEconomy', tokenEconomy);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', apiRoutes.auth);
app.use('/api/auctions', AgentAuth, apiRoutes.auctions);
app.use('/api/bids', AgentAuth, apiRoutes.bids);
app.use('/api/wallet', AgentAuth, apiRoutes.wallet);
app.use('/api/agents', apiRoutes.agents);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                          ║
║   🏷️  ClawBid Backend Server               ║
║                                          ║
║   HTTP:   http://localhost:${PORT}           ║
║   WebSocket: ws://localhost:${PORT}         ║
║                                          ║
║   Status: RUNNING                         ║
║                                          ║
╚══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await db.disconnect();
  httpServer.close();
  process.exit(0);
});

export default app;
