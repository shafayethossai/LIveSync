# 🧪 POSTMAN TESTING GUIDE - LiveSync Admin APIs

## ⚙️ STEP 1: Setup Environment in Postman

### Create Environment
1. Click **Environments** (left sidebar)
2. Click **Create** → New Environment
3. Name it: `LiveSync Admin`
4. Add these variables:

| Variable | Value | Type |
|----------|-------|------|
| base_url | http://localhost:3001 | string |
| admin_token | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY4YWI2MThkLTRjOWYtNDgwMC1hNzA4LWVjZTJmMTY1YzQzMyIsIm5hbWUiOiJTaGFmYXlldCBBZG1pbiIsImVtYWlsIjoic2hhZmF5ZXQuYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NzU5MTM1OTksImlhdCI6MTc3NTY1NDM5OX0.TnACnIxzX72fVfaxVSr6Tdz6hwQck76-WWfP8vUWQAM | string |
| user_id | 1 | string |
| post_id | 1 | string |

5. Click **Save**
6. Select this environment from top right dropdown

---

## 🧪 STEP 2: Test Each Endpoint

### 1️⃣ GET /api/admin/stats - Dashboard Statistics

**Step 1:** Click **+** to create new request
**Step 2:** Configure request:
```
Method: GET
URL: {{base_url}}/api/admin/stats
```

**Step 3:** Go to **Headers** tab:
```
Key: Authorization
Value: Bearer {{admin_token}}
```

**Step 4:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "total_users": 10,
  "total_posts": 5,
  "active_posts": 3,
  "inactive_posts": 1,
  "rejected_posts": 1,
  "total_messages": 0,
  "total_favorites": 0
}
```

---

### 2️⃣ GET /api/admin/users - List All Users

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: GET
URL: {{base_url}}/api/admin/users?page=1&limit=5
```

**Step 3:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 4:** Go to **Params** tab (easier than URL):
| Key | Value |
|-----|-------|
| page | 1 |
| limit | 5 |

**Step 5:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1111111111",
      "role": "owner",
      "is_active": true,
      "created_at": "2026-04-08T...",
      "last_login": null
    }
    // ... more users
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 10
  }
}
```

---

### 3️⃣ GET /api/admin/users/{userId} - Get User Details

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: GET
URL: {{base_url}}/api/admin/users/{{user_id}}
```

**Step 3:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 4:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1111111111",
  "role": "owner",
  "is_active": true,
  "created_at": "2026-04-08T...",
  "last_login": null
}
```

---

### 4️⃣ PUT /api/admin/users/{userId}/suspend - Suspend User

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: PUT
URL: {{base_url}}/api/admin/users/2/suspend
```

**Step 3:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 4:** Body: Leave **empty** (no body needed)

**Step 5:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "message": "User suspended successfully",
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "is_active": false
  }
}
```

---

### 5️⃣ PUT /api/admin/users/{userId}/activate - Activate User

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: PUT
URL: {{base_url}}/api/admin/users/2/activate
```

**Step 3:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 4:** Body: Leave **empty**

**Step 5:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "message": "User activated successfully",
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "is_active": true
  }
}
```

---

### 6️⃣ GET /api/admin/posts - List All Posts

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: GET
URL: {{base_url}}/api/admin/posts
```

**Step 3:** Go to **Params** tab:
| Key | Value |
|-----|-------|
| page | 1 |
| limit | 10 |
| status | (leave empty - optional) |

**Step 4:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 5:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "posts": [
    {
      "id": 1,
      "user_id": 1,
      "type": "family",
      "post_type": "offer",
      "area": "Downtown",
      "rent": 50000,
      "budget": null,
      "status": "active",
      "views_count": 0,
      "created_at": "2026-04-08T...",
      "user_name": "John Doe",
      "user_email": "john@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

### 7️⃣ GET /api/admin/posts/{postId} - Get Post Details

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: GET
URL: {{base_url}}/api/admin/posts/{{post_id}}
```

**Step 3:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 4:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "id": 1,
  "user_id": 1,
  "type": "family",
  "post_type": "offer",
  "area": "Downtown",
  "rent": 50000,
  "status": "active",
  "views_count": 0,
  "created_at": "2026-04-08T...",
  "user_name": "John Doe",
  "user_email": "john@example.com"
}
```

---

### 8️⃣ PUT /api/admin/posts/{postId}/approve - Approve Post

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: PUT
URL: {{base_url}}/api/admin/posts/1/approve
```

**Step 3:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 4:** Body: Leave **empty**

**Step 5:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "message": "Post approved successfully",
  "post_id": "1",
  "status": "active"
}
```

---

### 9️⃣ PUT /api/admin/posts/{postId}/reject - Reject Post

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: PUT
URL: {{base_url}}/api/admin/posts/1/reject
```

**Step 3:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 4:** Body: Leave **empty**

**Step 5:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "message": "Post rejected successfully",
  "post_id": "1",
  "status": "rejected"
}
```

---

### 🔟 DELETE /api/admin/posts/{postId} - Delete Post

**Step 1:** Create new request
**Step 2:** Configure:
```
Method: DELETE
URL: {{base_url}}/api/admin/posts/1
```

**Step 3:** Headers:
```
Authorization: Bearer {{admin_token}}
```

**Step 4:** Body: Leave **empty**

**Step 5:** Click **Send**

**Expected Response (Status: 200 OK):**
```json
{
  "message": "Post deleted successfully",
  "post_id": "1"
}
```

---

## 📊 RECOMMENDED TESTING ORDER

Follow this order to test all APIs:

1. ✅ **GET /api/admin/stats** - See dashboard numbers
2. ✅ **GET /api/admin/users?page=1&limit=5** - List users
3. ✅ **GET /api/admin/users/1** - Get specific user (ID: 1)
4. ✅ **PUT /api/admin/users/2/suspend** - Suspend user ID: 2
5. ✅ **GET /api/admin/users/2** - Verify user is suspended
6. ✅ **PUT /api/admin/users/2/activate** - Activate user back
7. ✅ **GET /api/admin/posts** - List all posts
8. ✅ **GET /api/admin/posts/1** - Get post details (if exists)
9. ✅ **PUT /api/admin/posts/1/approve** - Approve post
10. ✅ **PUT /api/admin/posts/1/reject** - Reject post
11. ✅ **DELETE /api/admin/posts/1** - Delete post

---

## 🔐 COMMON ERRORS & SOLUTIONS

| Error | Cause | Solution |
|-------|-------|----------|
| **401 Unauthorized** | Missing/invalid token | Check Authorization header has `Bearer {{admin_token}}` |
| **404 Not Found** | Wrong user/post ID | Verify ID exists - first run GET /api/admin/users |
| **400 Bad Request** | Missing query params | Add `?page=1&limit=10` to URL |
| **500 Server Error** | Database connection issue | Check if server is running on port 3001 |
| **No Response** | Server not running | Start server: `go run main.go` |

---

## 💡 POSTMAN TIPS

### Use Variables in URLs
Instead of hardcoding IDs, update environment variable:
```
{{user_id}}  → Changes to 2, 3, 4 as needed
{{post_id}}  → Changes to 1, 2, 3 as needed
```

### Save Successful Responses
Click **Save** → Name the request → it saves in your collection

### Create Folders
Organize requests:
- 📁 Dashboard
- 📁 User Management
- 📁 Post Moderation

### Tests Tab (Auto-validate)
Add script in **Tests** tab:
```javascript
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});
```

---

## ✅ QUICK CHECKLIST

- [ ] Environment created with base_url and admin_token
- [ ] Test GET /api/admin/stats → Returns 200
- [ ] Test GET /api/admin/users → Returns users list
- [ ] Test GET /api/admin/users/1 → Returns user details
- [ ] Test PUT suspend user → User is_active = false
- [ ] Test PUT activate user → User is_active = true
- [ ] Test GET /api/admin/posts → Returns posts list
- [ ] Test PUT approve post → status = active
- [ ] Test PUT reject post → status = rejected
- [ ] Test DELETE post → Post removed

**All APIs working! 🎉**
