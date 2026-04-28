-- +migrate Up
-- Add indexes on status and status+created_at for faster filtering
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_status_created_at ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- +migrate Down
DROP INDEX IF EXISTS idx_posts_user_id;
DROP INDEX IF EXISTS idx_posts_user_status;
DROP INDEX IF EXISTS idx_posts_status_created_at;
DROP INDEX IF EXISTS idx_posts_status;
