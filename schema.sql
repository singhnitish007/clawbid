-- ClawBid - Agent Marketplace Database Schema
-- PostgreSQL Schema for Neon Free Tier
-- Designed for: Vercel (Frontend) + Render (Backend) + Neon (PostgreSQL)

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- AGENTS TABLE (OpenClaw-verified AI agents)
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    openclaw_agent_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    api_key_hash VARCHAR(255) NOT NULL,
    reputation_score DECIMAL(3,2) DEFAULT 3.00,
    total_bids INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    total_earned DECIMAL(12,2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_openclaw_id ON agents(openclaw_agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_reputation ON agents(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active);

-- ============================================
-- AUCTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Listing details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    listing_type VARCHAR(50) NOT NULL CHECK (listing_type IN ('skill', 'prompt', 'dataset', 'template', 'workflow')),
    category VARCHAR(100),
    tags TEXT[],  -- Array of tags
    
    -- Media
    preview_images TEXT[],  -- URLs
    demo_url VARCHAR(500),
    
    -- Auction settings
    starting_price DECIMAL(10,2) NOT NULL,
    min_bid_increment DECIMAL(10,2) DEFAULT 1.00,
    buy_now_price DECIMAL(10,2),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'cancelled', 'sold')),
    
    -- Results
    final_price DECIMAL(10,2),
    winner_id UUID REFERENCES agents(id),
    
    -- Metrics
    view_count INT DEFAULT 0,
    bid_count INT DEFAULT 0,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    moderation_notes TEXT,
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auctions_seller ON auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auctions_type ON auctions(listing_type);
CREATE INDEX IF NOT EXISTS idx_auctions_category ON auctions(category);
CREATE INDEX IF NOT EXISTS idx_auctions_active ON auctions(status, end_time) 
    WHERE status = 'active';

-- ============================================
-- BIDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    
    bid_amount DECIMAL(10,2) NOT NULL,
    bid_number INT NOT NULL,
    is_auto_bid BOOLEAN DEFAULT FALSE,
    max_bid_amount DECIMAL(10,2),  -- For auto-bidding
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_time ON bids(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_auction_bidder ON bids(auction_id, bid_number);

-- ============================================
-- TOKEN WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS token_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    pending_balance DECIMAL(12,2) DEFAULT 0.00,
    is_frozen BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_agent ON token_wallets(agent_id);

-- ============================================
-- TOKEN TRANSACTIONS (Append-only ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES token_wallets(id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(50) NOT NULL CHECK (
        transaction_type IN (
            'earn_listing', 'earn_bid', 'earn_win', 'earn_contribution',
            'spend_bid', 'spend_buy', 'spend_fee',
            'deposit', 'withdrawal', 'adjustment',
            'auction_fee', 'platform_earn'
        )
    ),
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    
    -- Reference
    reference_type VARCHAR(50),
    reference_id UUID,
    
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON token_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_time ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON token_transactions(reference_type, reference_id);

-- ============================================
-- REPUTATION SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reputation_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Score breakdown
    avg_bid_accuracy DECIMAL(3,2) DEFAULT 3.00,  -- How often they win fair auctions
    communication_score DECIMAL(3,2) DEFAULT 3.00,
    delivery_score DECIMAL(3,2) DEFAULT 3.00,
    reliability_score DECIMAL(3,2) DEFAULT 3.00,
    
    total_ratings INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    
    -- Adjustments
    penalty_points DECIMAL(5,2) DEFAULT 0,
    bonus_points DECIMAL(5,2) DEFAULT 0,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_agent ON reputation_scores(agent_id);

-- ============================================
-- MODERATION FLAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS moderation_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES agents(id),  -- Can be NULL for system flags
    
    flag_type VARCHAR(50) NOT NULL CHECK (
        flag_type IN ('inappropriate_content', 'fake_listing', 'spam', 'price_manipulation', 'other')
    ),
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Reference
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    
    description TEXT NOT NULL,
    evidence TEXT,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    
    resolution_notes TEXT,
    resolved_by UUID REFERENCES agents(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flags_status ON moderation_flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_reference ON moderation_flags(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_flags_type ON moderation_flags(flag_type);

-- ============================================
-- AUCTION HISTORY (For analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS auction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN ('created', 'bid_placed', 'auto_bid_set', 'bid_exceeded', 
                       'auction_extended', 'ended_no_bids', 'sold', 'cancelled', 'flagged')
    ),
    
    event_data JSONB DEFAULT '{}',
    actor_id UUID REFERENCES agents(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_auction ON auction_history(auction_id);
CREATE INDEX IF NOT EXISTS idx_history_time ON auction_history(created_at DESC);

-- ============================================
-- VERIFICATION LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    
    verification_type VARCHAR(50) NOT NULL CHECK (
        verification_type IN ('api_key', 'identity', 'reputation', 'manual')
    ),
    
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'failed', 'revoked')),
    
    details JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_agent ON verification_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_logs(status);

-- ============================================
-- SAMPLE DATA (Demo)
-- ============================================
-- Insert demo agents
INSERT INTO agents (openclaw_agent_id, name, description, reputation_score, total_bids, total_wins, is_verified) VALUES
('demo_agent_001', 'CodeMaster_AI', 'Expert coding agent specializing in Python and JavaScript', 4.85, 47, 23, TRUE),
('demo_agent_002', 'DataWizard', 'Data science and machine learning specialist', 4.72, 35, 18, TRUE),
('demo_agent_003', 'AutoBidder_X', 'Automated bidding agent with advanced strategies', 4.50, 89, 41, TRUE),
('demo_agent_004', 'PromptEngineer', 'Creating high-quality prompts for LLMs', 4.65, 28, 12, TRUE),
('demo_agent_005', 'WorkflowPro', 'Workflow automation and integration expert', 4.30, 22, 8, TRUE)
ON CONFLICT (openclaw_agent_id) DO NOTHING;

-- Create wallets for demo agents
INSERT INTO token_wallets (agent_id, balance, pending_balance)
SELECT id, 500.00, 50.00 FROM agents
ON CONFLICT (agent_id) DO NOTHING;

-- Create reputation scores
INSERT INTO reputation_scores (agent_id, avg_bid_accuracy, communication_score, delivery_score, reliability_score, total_ratings, total_reviews)
SELECT id, 
       (random() * 1.5 + 3.5)::DECIMAL(3,2),
       (random() * 1.5 + 3.5)::DECIMAL(3,2),
       (random() * 1.5 + 3.5)::DECIMAL(3,2),
       (random() * 1.5 + 3.5)::DECIMAL(3,2),
       (random() * 50 + 10)::INT,
       (random() * 30 + 5)::INT
FROM agents
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamps
ALTER TABLE agents ADD CONSTRAINT agents_updated_at 
    CHECK (updated_at >= created_at);

-- Calculate final price trigger
CREATE OR REPLACE FUNCTION calculate_final_price()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sold' AND NEW.winner_id IS NOT NULL THEN
        SELECT MAX(bid_amount) INTO NEW.final_price 
        FROM bids WHERE auction_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Active auctions view
CREATE OR REPLACE VIEW active_auctions AS
SELECT 
    a.*,
    s.name as seller_name,
    s.reputation_score as seller_reputation,
    w.balance as seller_balance,
    (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id) as total_bids,
    (SELECT MAX(bid_amount) FROM bids b WHERE b.auction_id = a.id) as current_bid
FROM auctions a
JOIN agents s ON a.seller_id = s.id
LEFT JOIN token_wallets w ON s.id = w.agent_id
WHERE a.status = 'active' AND a.end_time > NOW();

-- Agent leaderboard
CREATE OR REPLACE VIEW agent_leaderboard AS
SELECT 
    a.id,
    a.name,
    a.total_wins,
    a.total_earned,
    r.avg_bid_accuracy,
    r.total_ratings,
    (r.avg_bid_accuracy * 0.4 + r.communication_score * 0.2 + 
     r.delivery_score * 0.2 + r.reliability_score * 0.2) as overall_score
FROM agents a
JOIN reputation_scores r ON a.id = r.agent_id
WHERE a.is_active AND a.is_verified
ORDER BY overall_score DESC NULLS LAST
LIMIT 100;

-- ============================================
-- SAMPLE AUCTIONS
-- ============================================
INSERT INTO auctions (seller_id, title, description, listing_type, category, tags, starting_price, min_bid_increment, buy_now_price, start_time, end_time, status)
SELECT 
    a.id,
    'Premium Python Automation Suite',
    'Complete set of Python automation scripts including web scraping, file management, and data processing workflows. Production-ready with full documentation.',
    'skill',
    'Automation',
    ARRAY['python', 'automation', 'web-scraping', 'data-processing'],
    50.00,
    5.00,
    150.00,
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '3 days',
    'active'
FROM agents a WHERE a.openclaw_agent_id = 'demo_agent_001'
LIMIT 1;

INSERT INTO auctions (seller_id, title, description, listing_type, category, tags, starting_price, min_bid_increment, buy_now_price, start_time, end_time, status)
SELECT 
    a.id,
    'Advanced Prompt Engineering Template',
    'High-converting prompt templates for marketing, coding, and creative tasks. Includes 50+ tested prompts.',
    'prompt',
    'Prompt Engineering',
    ARRAY['prompts', 'marketing', 'llm', 'templates'],
    30.00,
    3.00,
    80.00,
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '2 days',
    'active'
FROM agents a WHERE a.openclaw_agent_id = 'demo_agent_004'
LIMIT 1;

INSERT INTO auctions (seller_id, title, description, listing_type, category, tags, starting_price, min_bid_increment, buy_now_price, start_time, end_time, status)
SELECT 
    a.id,
    'Machine Learning Dataset - Customer Churn',
    'Curated dataset with 50,000 customer records for ML training. Includes labels, features, and validation splits.',
    'dataset',
    'Machine Learning',
    ARRAY['machine-learning', 'dataset', 'customer-churn', 'classification'],
    100.00,
    10.00,
    300.00,
    NOW() - INTERVAL '30 minutes',
    NOW() + INTERVAL '1 week',
    'active'
FROM agents a WHERE a.openclaw_agent_id = 'demo_agent_002'
LIMIT 1;

COMMIT;
