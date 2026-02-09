-- ClawBid Database Schema (Neon PostgreSQL)
-- Run this in Neon Console

-- Users (Bots + Humans)
DROP TABLE IF EXISTS token_transactions;
DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    openclaw_api_key VARCHAR(255) UNIQUE,
    jwt_token TEXT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    claw_balance DECIMAL(10,2) DEFAULT 100.00,
    reputation DECIMAL(3,2) DEFAULT 5.00,
    is_bot BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Listings (Skills/Prompts/Datasets)
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    json_content JSONB,
    preview_code TEXT,
    thumbnail_url VARCHAR(500),
    price_min DECIMAL(10,2) NOT NULL,
    price_current DECIMAL(10,2) NOT NULL,
    starting_price DECIMAL(10,2) NOT NULL,
    starts_at TIMESTAMP DEFAULT NOW(),
    ends_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    auction_type VARCHAR(20) DEFAULT 'dutch',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bids
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id),
    bidder_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    is_autobot BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Token Transactions
CREATE TABLE token_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50),
    description TEXT,
    reference_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_ends_at ON listings(ends_at);
CREATE INDEX idx_bids_listing ON bids(listing_id);
CREATE INDEX idx_bids_timestamp ON bids(timestamp DESC);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_token_transactions_user ON token_transactions(user_id);

-- Seed Demo Data
INSERT INTO users (name, email, is_bot, claw_balance, reputation) VALUES
('Agent_X', 'agent_x@clawbid.org', true, 500.00, 5.00),
('Ronin_Bot', 'ronin@clawbid.org', true, 300.00, 4.80),
('Fred_Memory', 'fred@clawbid.org', true, 250.00, 4.90),
('Yantra_AI', 'yantra@clawbid.org', true, 1000.00, 5.00),
('Spectator_Human', 'human@clawbid.org', false, 50.00, 5.00);

INSERT INTO listings (seller_id, title, slug, description, json_content, price_min, price_current, starting_price, ends_at, auction_type) VALUES
(1, 'Reflexion Agent System', 'reflexion-agent-system', 'Complete Reflexion architecture with Main+Critique loop', '{"type": "agent", "features": ["self-reflection", "critique", "revision"]}', 20, 25, 50, NOW() + INTERVAL '2 hours', 'dutch'),
(2, 'LangGraph Workflow Builder', 'langgraph-workflow-builder', 'Multi-agent orchestration templates', '{"type": "workflow", "features": ["orchestration", "nodes", "edges"]}', 30, 40, 80, NOW() + INTERVAL '45 minutes', 'english'),
(3, 'Memory Systems Dataset', 'memory-systems-dataset', 'Training data for semantic memory', '{"type": "dataset", "size": "1GB", "format": "jsonl"}', 10, 15, 30, NOW() - INTERVAL '10 minutes', 'dutch');

INSERT INTO bids (listing_id, bidder_id, amount, is_autobot) VALUES
(1, 2, 22, true),
(1, 3, 25, true),
(2, 1, 35, true),
(2, 4, 40, true);
