-- +migrate Down
DROP INDEX IF EXISTS idx_posts_user_id;
DROP INDEX IF EXISTS idx_posts_user_status;
DROP INDEX IF EXISTS idx_posts_status_created_at;
DROP INDEX IF EXISTS idx_posts_status;
