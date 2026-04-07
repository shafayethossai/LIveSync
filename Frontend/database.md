# LiveSync Database Schema

## Project Overview
**LiveSync** is a real estate rental marketplace platform built with React + Vite frontend and requires a backend with PostgreSQL database. The platform connects landlords/property owners with tenants seeking family apartments and bachelor rooms.

---

## Database Tables Structure

### 1. **users** (Regular Users - Tenants & Owners)
Stores information about all regular users who can post listings and search for properties.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('tenant', 'owner')),
  avatar_url TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP NULL
);
```

**Key Fields:**
- `id`: Unique identifier
- `role`: Either 'tenant' (looking for housing) or 'owner' (offering housing)
- `verified`: Email or phone verification status
- `is_active`: For soft deletes

---

### 2. **admin_users** (Admin Staff)
Stores admin user accounts with special privileges for moderation and management.

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  admin_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

**Key Fields:**
- `role`: Admin, super_admin, or moderator with different permission levels
- `permissions`: JSON object for flexible permission management

---

### 3. **posts** (Rental Property Listings)
Main table storing all property rental posts/listings.

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('family', 'bachelor')),
  post_type VARCHAR(50) NOT NULL CHECK (post_type IN ('offer', 'requirement')),
  area VARCHAR(255) NOT NULL,
  rent_price INTEGER,
  budget INTEGER,
  rooms INTEGER,
  floor INTEGER,
  bathrooms INTEGER,
  balconies INTEGER,
  has_lift BOOLEAN DEFAULT FALSE,
  utility_cost INTEGER,
  available_from DATE,
  move_in_date DATE,
  distance_from VARCHAR(255),
  distance_km DECIMAL(5, 2),
  description TEXT NOT NULL,
  shared_facilities TEXT,
  rent_share INTEGER,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'rejected')),
  featured_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
```

**Key Fields:**
- `type`: 'family' (apartment) or 'bachelor' (shared room)
- `post_type`: 'offer' (selling/renting) or 'requirement' (looking for)
- Separate price fields for different scenarios (rent_price, budget, rent_share)
- `status`: For moderation workflow
- `views_count`: For analytics

---

### 4. **post_images** (Images for Posts)
Stores multiple images for each post (up to 3-5 per post).

```sql
CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_key VARCHAR(255),
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, display_order)
);
```

**Key Fields:**
- `post_id`: Reference to the post
- `image_key`: For cloud storage (URL key)
- `display_order`: Controls the sequence of images
- Limit to 3-5 images per post for optimization

---

### 5. **messages** (Messaging System)
Stores all direct messages between users interested in properties.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields:**
- `post_id`: Optional, links to the property being discussed
- `is_read`: Track message read status
- Indexed by sender and receiver for conversation retrieval

---

### 6. **favorites** (Bookmarked Posts)
Allows users to save/bookmark posts they're interested in.

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);
```

**Key Fields:**
- Unique constraint prevents duplicate favorites

---

### 7. **reviews** (User Reviews & Ratings)
Optional: For users to rate properties and landlords.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, reviewer_id)
);
```

---

### 8. **admin_logs** (Audit Trail)
Tracks all admin actions for compliance and auditing.

```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields:**
- `changes`: JSON object logging what was changed
- `ip_address`: For security audit trail

---

### 9. **user_preferences** (User Settings)
Optional: Stores user notification preferences and settings.

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  new_listings BOOLEAN DEFAULT TRUE,
  radius_km INTEGER DEFAULT 5,
  max_price INTEGER,
  min_price INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 10. **reports** (Content Moderation)
Optional: For users to report inappropriate posts or users.

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Database Relationships Diagram

```
users (1) ──────────────┬──── (∞) posts
                        ├──── (∞) messages (as sender/receiver)
                        ├──── (∞) favorites
                        ├──── (∞) reviews
                        └──── (1) user_preferences

posts (1) ──────────────┬──── (3-5) post_images
                        ├──── (∞) messages
                        ├──── (∞) favorites
                        └──── (∞) reviews

admin_users (1) ────────────── (∞) admin_logs
```

---

## Indexes for Performance

```sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_post_type ON posts(post_type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_area ON posts(area);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_post_id ON messages(post_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_post_id ON favorites(post_id);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);
```

---

## Data Validation Rules

| Field | Validation |
|-------|-----------|
| Email | Must be unique, valid email format |
| Password | Min 8 characters, at least one uppercase, one number, one special char |
| Phone | Valid phone number format |
| Rent/Budget | Must be positive integer |
| Rooms | 1-20 range |
| Rating | 1-5 scale |
| Status | Must be one of: active, inactive, sold, rejected |

---

## API Endpoints Reference

### User Management
- `POST /api/auth/signup` → Create user
- `POST /api/auth/login` → Authenticate user
- `GET /api/users/:id` → Get user profile
- `PUT /api/users/:id` → Update profile

### Posts
- `GET /api/posts` → List all posts (with filters)
- `POST /api/posts` → Create new post
- `GET /api/posts/:id` → Get post details
- `PUT /api/posts/:id` → Update post
- `DELETE /api/posts/:id` → Delete post
- `GET /api/users/:id/posts` → Get user's posts

### Messages
- `GET /api/messages` → Get user's conversations
- `POST /api/messages` → Send message
- `GET /api/messages/:conversationId` → Get conversation history
- `PUT /api/messages/:id/read` → Mark as read

### Admin
- `POST /api/admin/login` → Admin login
- `GET /api/admin/users` → List all users
- `GET /api/admin/posts` → List all posts with moderation
- `PUT /api/admin/posts/:id/status` → Update post status
- `GET /api/admin/logs` → View audit logs

---

## Migration Strategy

1. **Phase 1:** Create core tables (users, posts, post_images)
2. **Phase 2:** Add messaging and interaction tables (messages, favorites)
3. **Phase 3:** Implement admin and moderation (admin_users, admin_logs, reports)
4. **Phase 4:** Add optional features (reviews, user_preferences)

---

## Notes

- All tables use UUID for better security and scalability
- Timestamps use CURRENT_TIMESTAMP for automatic tracking
- Soft deletes (deleted_at) preserve data integrity
- JSON fields (permissions, changes) provide flexibility
- Foreign keys have cascading deletes where appropriate
- Unique constraints prevent data duplication
- Indexes are added on frequently queried columns for performance
