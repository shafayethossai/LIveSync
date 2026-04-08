# Backend Requirements for Admin Portal Authentication & Management

## Overview
This document outlines all backend requirements for admin portal functionality with database integration.

---

## 1. DATABASE SCHEMA

### Admin Table
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Hash with bcrypt
  phone VARCHAR(20) NULL,
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(50) DEFAULT 'admin',  -- Possible values: admin, super_admin, moderator
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL  -- Soft delete
);

-- Create index for faster lookups
CREATE UNIQUE INDEX idx_admins_email ON admins(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_admins_is_active ON admins(is_active) WHERE deleted_at IS NULL;
```

### Admin Audit Log Table (Optional but recommended)
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,  -- login, logout, create_user, delete_post, etc.
  resource_type VARCHAR(50) NULL,  -- user, post, comment, etc.
  resource_id UUID NULL,
  old_value JSONB NULL,
  new_value JSONB NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at);
```

---

## 2. API ENDPOINTS

### Authentication Endpoints

#### 2.1 Admin Login
**Endpoint:** `POST /api/admins/login`

**Request Body:**
```json
{
  "email": "admin@livesync.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin User",
    "email": "admin@livesync.com",
    "phone": "+1234567890",
    "role": "admin",
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Email and password required
- `401` - Invalid credentials
- `403` - Admin account is inactive
- `500` - Server error

---

#### 2.2 Admin Signup (Admin Registration)
**Endpoint:** `POST /api/admins`

**Request Body:**
```json
{
  "name": "New Admin",
  "email": "newadmin@livesync.com",
  "password": "securePassword123",
  "phone": "+1234567890"
}
```

**Success Response (201):**
```json
{
  "message": "Admin account created successfully",
  "admin": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "New Admin",
    "email": "newadmin@livesync.com",
    "phone": "+1234567890",
    "role": "admin",
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields or invalid password format
- `409` - Email already exists
- `500` - Server error

**Validation Rules:**
- password: minimum 8 characters
- email: valid email format
- name: minimum 2 characters

---

#### 2.3 Get Current Admin
**Endpoint:** `GET /api/admins/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Admin User",
  "email": "admin@livesync.com",
  "phone": "+1234567890",
  "role": "admin",
  "is_active": true,
  "last_login": "2026-01-20T15:45:00Z",
  "created_at": "2026-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401` - Unauthorized / Invalid or expired token
- `404` - Admin not found
- `500` - Server error

---

#### 2.4 Admin Logout (Optional)
**Endpoint:** `POST /api/admins/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Admin Management Endpoints

#### 2.5 Get All Admins (Super Admin Only)
**Endpoint:** `GET /api/admins`

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 10, max: 100)
- `role`: string (optional) - filter by role

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Admin User",
      "email": "admin@livesync.com",
      "role": "admin",
      "is_active": true,
      "last_login": "2026-01-20T15:45:00Z",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (not super admin)
- `500` - Server error

---

#### 2.6 Update Admin Profile
**Endpoint:** `PUT /api/admins/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+9876543210"
}
```

**Success Response (200):**
```json
{
  "message": "Admin updated successfully",
  "admin": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Name",
    "email": "admin@livesync.com",
    "phone": "+9876543210",
    "role": "admin",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-20T16:00:00Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (not own profile or not super admin)
- `404` - Admin not found
- `500` - Server error

---

#### 2.7 Change Admin Password
**Endpoint:** `PUT /api/admins/{id}/password`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "old_password": "currentPassword123",
  "new_password": "newPassword456"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Invalid password format
- `401` - Unauthorized
- `403` - Incorrect old password
- `404` - Admin not found
- `500` - Server error

---

#### 2.8 Deactivate Admin (Super Admin Only)
**Endpoint:** `PUT /api/admins/{id}/deactivate`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "message": "Admin deactivated",
  "admin": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "is_active": false
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (not super admin)
- `404` - Admin not found
- `500` - Server error

---

### User Management Endpoints (For Admin Dashboard)

These endpoints should be protected and only accessible to admins.

#### 2.9 Get All Users
**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `page`: integer
- `limit`: integer
- `search`: string (search by name/email)
- `status`: string (active, inactive, suspended)

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "+1234567890",
      "status": "active",
      "created_at": "2026-01-10T10:00:00Z",
      "last_login": "2026-01-20T15:45:00Z",
      "post_count": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150
  }
}
```

---

#### 2.10 Get User Details
**Endpoint:** `GET /api/admin/users/{userId}`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "name": "User Name",
  "email": "user@example.com",
  "phone": "+1234567890",
  "created_at": "2026-01-10T10:00:00Z",
  "updated_at": "2026-01-20T10:00:00Z",
  "last_login": "2026-01-20T15:45:00Z",
  "is_active": true,
  "posts": [
    {
      "id": "post-uuid",
      "title": "Post Title",
      "created_at": "2026-01-15T10:00:00Z",
      "status": "published"
    }
  ]
}
```

---

#### 2.11 Suspend/Ban User
**Endpoint:** `PUT /api/admin/users/{userId}/suspend`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "reason": "Violation of community guidelines",
  "duration_days": 30  // null for permanent
}
```

**Success Response (200):**
```json
{
  "message": "User suspended successfully",
  "user": {
    "id": "uuid",
    "status": "suspended",
    "suspend_reason": "Violation of community guidelines",
    "suspend_until": "2026-02-19T10:00:00Z"
  }
}
```

---

#### 2.12 Unsuspend User
**Endpoint:** `PUT /api/admin/users/{userId}/unsuspend`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Success Response (200):**
```json
{
  "message": "User unsuspended",
  "user": {
    "id": "uuid",
    "status": "active"
  }
}
```

---

### Post Management Endpoints (For Admin Dashboard)

#### 2.13 Get All Posts
**Endpoint:** `GET /api/admin/posts`

**Query Parameters:**
- `page`: integer
- `limit`: integer
- `status`: string (published, pending, rejected, deleted)
- `search`: string

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "post-uuid",
      "title": "Property Listing",
      "user_id": "user-uuid",
      "user_name": "User Name",
      "status": "published",
      "created_at": "2026-01-15T10:00:00Z",
      "views": 150,
      "flag_count": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 500
  }
}
```

---

#### 2.14 Get Post Details
**Endpoint:** `GET /api/admin/posts/{postId}`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Success Response (200):**
```json
{
  "id": "post-uuid",
  "title": "Property Listing",
  "description": "Full description",
  "user_id": "user-uuid",
  "user_name": "User Name",
  "location": "City, State",
  "price": 250000,
  "status": "published",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-20T10:00:00Z",
  "images": ["url1", "url2"],
  "flags": [
    {
      "id": "flag-uuid",
      "reason": "Inappropriate content",
      "flagged_by": "user-uuid",
      "created_at": "2026-01-19T10:00:00Z"
    }
  ]
}
```

---

#### 2.15 Delete/Reject Post
**Endpoint:** `DELETE /api/admin/posts/{postId}`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "reason": "Violates community guidelines",
  "notify_user": true
}
```

**Success Response (200):**
```json
{
  "message": "Post deleted successfully"
}
```

---

#### 2.16 Flag/Report Post
**Endpoint:** `POST /api/admin/posts/{postId}/unflag`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Success Response (200):**
```json
{
  "message": "Post flags cleared"
}
```

---

### Dashboard Stats Endpoint

#### 2.17 Admin Dashboard Statistics
**Endpoint:** `GET /api/admin/stats`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Success Response (200):**
```json
{
  "users": {
    "total": 1500,
    "active": 1200,
    "inactive": 250,
    "suspended": 50,
    "new_this_month": 120
  },
  "posts": {
    "total": 5000,
    "published": 4500,
    "pending": 300,
    "rejected": 100,
    "flagged": 15,
    "new_this_month": 450
  },
  "engagement": {
    "total_messages": 12000,
    "new_this_week": 850,
    "avg_response_time_hours": 4.5
  },
  "moderation": {
    "flagged_content": 15,
    "pending_reviews": 8,
    "resolved_this_month": 450
  }
}
```

---

## 3. AUTHENTICATION & SECURITY

### JWT Token Requirements
- **Algorithm:** HS256 or RS256
- **Expiration:** 7 days for admins (or 24 hours, configurable)
- **Claims:**
  ```json
  {
    "sub": "admin_id",
    "email": "admin@example.com",
    "role": "admin",
    "type": "admin",
    "iat": 1642512000,
    "exp": 1643116800
  }
  ```

### Password Security
- Minimum 8 characters
- At least one uppercase, one lowercase, one number, one special character (recommended)
- Hash with bcrypt (cost factor: 10-12)
- Never store plain text passwords

### Rate Limiting
- Login endpoint: 5 attempts per 15 minutes per IP
- Other endpoints: 100 requests per minute per token

### CORS Configuration
```
Allowed Origins: http://localhost:5173 (dev), https://yourdomain.com (prod)
Allowed Methods: GET, POST, PUT, DELETE
Allowed Headers: Content-Type, Authorization
```

---

## 4. ERROR HANDLING

### Standard Error Response Format
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": null,
    "timestamp": "2026-01-20T15:45:00Z"
  }
}
```

### Common Error Codes
- `INVALID_CREDENTIALS` - Login failed
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists (e.g., duplicate email)
- `VALIDATION_ERROR` - Invalid input data
- `INTERNAL_ERROR` - Server error

---

## 5. DATABASE MIGRATION SCRIPT

```sql
-- For PostgreSQL
BEGIN;

-- Create ENUM for admin roles
CREATE TYPE admin_role AS ENUM ('admin', 'super_admin', 'moderator');

-- Create admins table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  role admin_role DEFAULT 'admin',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes
CREATE UNIQUE INDEX idx_admins_email_active ON admins(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_admins_is_active ON admins(is_active);
CREATE INDEX idx_admins_role ON admins(role);

-- Create admin audit logs table
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at);

COMMIT;
```

---

## 6. IMPLEMENTATION CHECKLIST

### Backend (Go)
- [ ] Create admin model with validations
- [ ] Implement JWT authentication middleware
- [ ] Create admin signup endpoint with email validation
- [ ] Create admin login endpoint with password hashing
- [ ] Create admin profile endpoint (/admins/me)
- [ ] Implement password change endpoint
- [ ] Create admin management endpoints (list, update, deactivate)
- [ ] Create user management endpoints for admin dashboard
- [ ] Create post management endpoints for admin dashboard
- [ ] Create dashboard statistics endpoint
- [ ] Add audit logging for admin actions
- [ ] Implement rate limiting
- [ ] Add input validation and error handling
- [ ] Write unit tests for auth endpoints
- [ ] Add database migrations
- [ ] Document API with Swagger/OpenAPI

### Frontend (React)
- [x] Create useAdminAuth hook
- [x] Update AdminAuthContext
- [x] Create AdminSignup component
- [x] Update AdminLogin component with API integration
- [x] Add admin signup route
- [x] Update API interceptors for admin tokens
- [ ] Create admin dashboard with stats
- [ ] Create user management page
- [ ] Create post management page  
- [ ] Add protected route component for admin pages
- [ ] Add logout functionality

---

## 7. TEST CREDENTIALS (For Initial Setup)

Create a super admin user in the database after migrations:

```sql
INSERT INTO admins (name, email, password, phone, is_active, role)
VALUES (
  'Super Admin',
  'superadmin@livesync.com',
  '$2a$12$[bcrypt_hash_of_SecurePassword123]',  -- Use bcrypt(SecurePassword123)
  '+1234567890',
  true,
  'super_admin'
);
```

---

## 8. ENVIRONMENT VARIABLES

```env
# Backend
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION_HOURS=168  # 7 days
BCRYPT_COST=12
DATABASE_URL=postgresql://user:password@localhost:5432/livesync
ADMIN_TOKEN_EXPIRY=7d
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Frontend
VITE_API_URL=http://localhost:3001/api  # dev
# VITE_API_URL=https://api.yourdomain.com/api  # prod
```

---

## 9. NEXT STEPS

1. **Backend Development:**
   - Set up Go project with gin framework
   - Create database migrations
   - Implement all endpoints listed above
   - Add middleware for JWT validation
   - Implement audit logging

2. **Frontend Updates:**
   - Add protected routes for admin pages
   - Create admin dashboard UI
   - Create user management interface
   - Create post management interface
   - Add logout functionality

3. **Testing:**
   - Write unit tests for auth
   - Write integration tests
   - Test with Postman/Thunder Client

4. **Deployment:**
   - Set up CI/CD pipeline
   - Configure production environment variables
   - Set up SSL certificates
   - Deploy backend and frontend

---

## 10. ADDITIONAL NOTES

- All timestamps should be in UTC (ISO 8601 format)
- Use soft deletes for audit trail
- Implement comprehensive logging for debugging
- Consider implementing 2FA for admin accounts
- Regular security audits recommended
- Keep JWT_SECRET secure and rotate periodically
