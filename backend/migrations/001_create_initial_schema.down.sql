-- +migrate Down

-- Drop indexes
DROP INDEX IF EXISTS idx_posts_created_at;
DROP INDEX IF EXISTS idx_posts_area;
DROP INDEX IF EXISTS idx_posts_user_id;

-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS users;
