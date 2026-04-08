# Admin Portal Implementation - Frontend Summary

## What's Been Implemented

### 1. **Frontend Authentication Files**

#### New Files Created:
- `src/hooks/auth/useAdminAuth.js` - Admin authentication hook (similar to user auth)
- `src/components/pages/admin/AdminSignup.jsx` - Admin signup page

#### Files Updated:
- `src/components/context/AdminAuthContext.jsx` - Refactored to use useAdminAuth hook
- `src/components/pages/admin/AdminLogin.jsx` - Updated to use API with async login
- `src/services/api.js` - Enhanced to handle both user and admin tokens
- `src/routes.jsx` - Added admin signup route

### 2. **Frontend Features**

✅ **Admin Login**
- Uses API endpoint: `POST /api/admins/login`
- Stores JWT token as `admin_token` in localStorage
- Auto-redirects to dashboard when logged in
- Shows loading state during login

✅ **Admin Signup**
- Uses API endpoint: `POST /api/admins`
- Form includes: Name, Email, Password, Phone
- Validates input before submission
- Redirects to login after successful signup

✅ **Token Management**
- Separate admin token (`admin_token`) from user token
- API interceptor automatically adds token to all requests
- Auto-logout on 401 unauthorized response
- Redirects to appropriate login page (admin/user) based on which token failed

✅ **Protected Admin Context**
- `useAdminAuth()` hook provides: admin, loading, loginAdmin, signupAdmin, logoutAdmin

---

## Frontend Code Structure

### useAdminAuth Hook
```javascript
const { 
  admin,           // Current admin object or null
  loading,         // Initial loading state
  loginAdmin,      // Function(email, password) -> Promise
  signupAdmin,     // Function(name, email, password, phone) -> Promise
  logoutAdmin,     // Function() -> void
  fetchCurrentAdmin // Function() -> Promise
} = useAdminAuth();
```

### AdminAuthContext
Uses the `useAdminAuth` hook internally and provides all methods via context.

---

## Backend Required Endpoints

### Authentication Endpoints (REQUIRED)
1. **POST /api/admins/login**
   - Input: { email, password }
   - Output: { token, admin: { id, name, email, phone, role, created_at } }

2. **POST /api/admins**
   - Input: { name, email, password, phone }
   - Output: { message, admin: { ... } }

3. **GET /api/admins/me**
   - Header: Authorization: Bearer {token}
   - Output: { id, name, email, phone, role, is_active, last_login, created_at }

### Optional Admin Management Endpoints
4. **POST /api/admins/logout**
5. **GET /api/admins**
6. **PUT /api/admins/{id}**
7. **PUT /api/admins/{id}/password**
8. **PUT /api/admins/{id}/deactivate**

### Dashboard Endpoints (For Admin Features)
- **GET /api/admin/users** - List all users
- **GET /api/admin/users/{userId}** - Get user details
- **GET /api/admin/posts** - List all posts
- **GET /api/admin/posts/{postId}** - Get post details
- **GET /api/admin/stats** - Dashboard statistics
- **PUT /api/admin/users/{userId}/suspend** - Suspend user
- **DELETE /api/admin/posts/{postId}** - Delete post

---

## Database Schema Required

### admins table
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(50) DEFAULT 'admin',  -- admin, super_admin, moderator
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

See `BACKEND_REQUIREMENTS.md` for complete schema details.

---

## Frontend Routes Added/Updated

| Route | Component | Status |
|-------|-----------|--------|
| `/admin/login` | AdminLogin | ✅ Updated |
| `/admin/signup` | AdminSignup | ✅ New |
| `/admin/dashboard` | AdminDashboard | ⏳ Need UI updates |
| `/admin/users` | AdminUsers | ⏳ Need UI updates |
| `/admin/posts` | AdminPosts | ⏳ Need UI updates |

---

## Flow Diagram

### Admin Signup Flow
```
AdminSignup Component
    ↓
signupAdmin(name, email, password, phone)
    ↓
POST /api/admins (Backend validates & creates)
    ↓
Returns success message
    ↓
Navigate to /admin/login
```

### Admin Login Flow
```
AdminLogin Component
    ↓
loginAdmin(email, password)
    ↓
POST /api/admins/login (Backend validates & returns token)
    ↓
Stores token + admin data in localStorage
    ↓
Sets admin state via context
    ↓
Navigate to /admin/dashboard (via useEffect)
```

### Protected Admin Route Check
```
Any Admin Page
    ↓
useAdminAuth() hook
    ↓
Check if admin && token exist
    ↓
If not, redirect to /admin/login
```

---

## API Interceptor Logic

```javascript
// Request Interceptor
- Checks for admin_token first, then user token
- Adds "Authorization: Bearer {token}" header

// Response Interceptor (401 error)
- If admin_token exists → clear admin data + redirect to /admin/login
- If user token exists → clear user data + redirect to /login
```

---

## Testing the Frontend

### 1. Test Admin Signup
```bash
1. Navigate to http://localhost:5173/admin/signup
2. Fill in form:
   - Name: John Admin
   - Email: johnadmin@example.com
   - Password: SecurePass123
   - Phone: +1234567890
3. Click "Create Admin Account"
4. Should redirect to /admin/login
```

### 2. Test Admin Login
```bash
1. Navigate to http://localhost:5173/admin/login
2. Enter credentials (from signup or created in DB)
3. Click "Access Admin Panel"
4. Should redirect to /admin/dashboard (if backend implemented)
5. Check localStorage for admin_token and livesync_admin
```

### 3. Test Token Persistence
```bash
1. Login as admin
2. Refresh the page
3. Should automatically load admin user (via fetchCurrentAdmin)
4. No need to login again
```

### 4. Test Auto-logout on 401
```bash
1. Manually clear admin_token from localStorage
2. Make API call from secured endpoint
3. Should get 401 response
4. Should redirect to /admin/login
```

---

## Error Handling

The frontend handles these error scenarios:

- **Invalid credentials**: Shows error message from backend
- **Network error**: Shows generic error message
- **Validation error**: Shows backend validation message
- **Expired token**: Automatically redirects to login
- **Missing required fields**: Form validation prevents submission

---

## Next Steps for Backend Development

### Priority 1 (Core Auth)
1. Create `admins` table
2. Implement `POST /api/admins/login`
3. Implement `POST /api/admins`
4. Implement `GET /api/admins/me`

### Priority 2 (Admin Management)
5. Implement admin list/update endpoints
6. Add audit logging

### Priority 3 (Dashboard)
7. Implement user management endpoints
8. Implement post management endpoints
9. Implement stats endpoint

---

## Important Notes

1. **Token Storage**: Both user (`token`) and admin (`admin_token`) tokens are stored separately
2. **Password Hashing**: Backend must hash passwords with bcrypt
3. **JWT Expiration**: Set appropriate expiration (7 days recommended for admin)
4. **Database**: All admin accounts must be in `admins` table (separate from users table)
5. **Validation**: Backend should validate all inputs (email format, password strength, etc.)
6. **Rate Limiting**: Implement on login endpoint to prevent brute force

---

## File Locations

| File | Location |
|------|----------|
| Auth Hook | `src/hooks/auth/useAdminAuth.js` |
| Auth Context | `src/components/context/AdminAuthContext.jsx` |
| Login Page | `src/components/pages/admin/AdminLogin.jsx` |
| Signup Page | `src/components/pages/admin/AdminSignup.jsx` |
| API Service | `src/services/api.js` |
| Routes | `src/routes.jsx` |
| Backend Requirements | `BACKEND_REQUIREMENTS.md` |

---

## Environment Variables

Add to `.env` file (frontend):
```env
VITE_API_URL=http://localhost:3001/api
```

The API service already uses this as baseURL.

---

## Summary

✅ Frontend is complete and ready for backend integration
✅ All auth flow implemented with proper error handling
✅ Separate token management for admins
✅ Ready to connect to backend endpoints
⏳ Backend needs to implement all endpoints in BACKEND_REQUIREMENTS.md

Once backend is ready, the admin portal will be fully functional!
