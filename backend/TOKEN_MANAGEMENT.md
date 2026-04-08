# 🔐 ADMIN TOKEN MANAGEMENT GUIDE

## Current Token Status ✅

**New Token Generated:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluIFVzZXIiLCJlbWFpbCI6ImFkbWluQGxpdmVzeW5jLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3NTkxNjc0MiwiaWF0IjoxNzc1NjU3NTQyfQ.roXeDKINAu5NtDiHQB_zRqth183ufuCZ5H4mxzhsrVs`

**Valid Until:** April 11, 2026 (72 hours from generation)

---

## How to Regenerate Token When Expired

### Method 1: Using Python (Easiest)

```bash
python3 << 'EOF'
import jwt
import json
from datetime import datetime, timedelta

secret_key = "livesync-secret-key-2026-change-in-production"

payload = {
    "id": 1,
    "name": "Admin User",
    "email": "admin@livesync.com",
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(hours=72),
    "iat": datetime.utcnow()
}

token = jwt.encode(payload, secret_key, algorithm="HS256")
print(token)
EOF
```

**Steps:**
1. Open Terminal
2. Copy the Python code above
3. Run it
4. Copy the output token
5. Update in Postman

---

### Method 2: Update Postman Environment

**If token expires in Postman:**

1. Click **Environments** (left sidebar)
2. Select `LiveSync Admin` environment
3. Find `admin_token` variable
4. Click on the value
5. Paste new token
6. Click **Save**

---

### Method 3: Using curl CLI

First, generate token:
```bash
python3 << 'EOF'
import jwt
from datetime import datetime, timedelta

payload = {
    "id": 1,
    "name": "Admin User",
    "email": "admin@livesync.com",
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(hours=72),
    "iat": datetime.utcnow()
}

token = jwt.encode(payload, "livesync-secret-key-2026-change-in-production", algorithm="HS256")
print(token)
EOF
```

Then use in curl:
```bash
curl -X GET http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer YOUR_NEW_TOKEN_HERE"
```

---

## Important Configuration Files

**Secret Key Location:** `/home/shafayet/Software Final Project/Backend/.env`

```
SECRETKEY=livesync-secret-key-2026-change-in-production
```

**If you change secret key in .env:**
1. Update the Python script's `secret_key` variable
2. Restart backend server: `go run main.go`
3. Generate new token with the new secret key

---

## Error: 401 Unauthorized

**Cause:** Token expired or invalid

**Solution:**
1. Generate new token (use Python method above)
2. Replace in Postman
3. Try request again

---

## Error: Socket hang up / No Response

**Cause:** Backend server not running

**Solution:**
```bash
cd "/home/shafayet/Software Final Project/Backend"
go run main.go
```

Server should be running on `http://localhost:3001`

---

## Quick Reference

| Item | Value |
|------|-------|
| Secret Key | `livesync-secret-key-2026-change-in-production` |
| Token Expiry | 72 hours |
| Base URL | `http://localhost:3001` |
| Token Type | `Bearer` |
| Algorithm | `HS256` |

---

## Postman Collection Updated ✅

**File:** `LiveSync_Admin_APIs.postman_collection.json`

The collection has been updated with the new token. Simply:
1. **File** → **Import**
2. Upload the updated JSON file
3. Select the environment
4. All requests will work!

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token still says expired | Clear browser cache, reload Postman |
| Can't find environment variable | Create new environment with base_url and admin_token |
| 404 on endpoints | Check if IDs exist in database first |
| 500 server error | Check backend logs, restart server |

