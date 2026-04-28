-- +migrate Up
-- Add additional performance indexes for frequently filtered queries

-- Indexes on users table for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Indexes on posts table for common queries
CREATE INDEX IF NOT EXISTS idx_posts_area_status ON posts(area, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);

-- Indexes on messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);
