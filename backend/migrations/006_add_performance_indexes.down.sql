-- +migrate Down
-- Remove performance indexes

DROP INDEX IF EXISTS idx_messages_conversation;
DROP INDEX IF EXISTS idx_posts_post_type;
DROP INDEX IF EXISTS idx_posts_type;
DROP INDEX IF EXISTS idx_posts_area_status;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_email;
