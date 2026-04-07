# Backend Integration Guide: Go + PostgreSQL with React Frontend

## 1. Integration Architecture Overview

### Setup Steps:
1. **Go Backend** (Port: 3001 or 5000)
   - API endpoints for user authentication, posts, messages
   - PostgreSQL database connection
   - JWT token generation and validation

2. **React Frontend** (Port: 5173)
   - API client to communicate with Go backend
   - JWT token storage in localStorage
   - Request/Response interceptors

3. **CORS Configuration**
   ```go
   // In your Go backend main.go
   import "github.com/rs/cors"
   
   router := mux.NewRouter()
   c := cors.Default()
   handler := c.Handler(router)
   http.ListenAndServe(":3001", handler)
   ```

---

## 2. JWT Authentication Implementation

### Step 1: Frontend Login Page Setup

Create an API service file:

```javascript
// src/services/api.js
const API_URL = 'http://localhost:3001/api';

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    
    // Store JWT token
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Add token to all requests
export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  
  return response.json();
};
```

### Step 2: Update Login Component

```javascript
// src/components/pages/Login.jsx
import { loginUser } from '../../services/api';

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await loginUser(email, password);
    
    // Store user data
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirect to dashboard
    navigate('/dashboard');
    
  } catch (error) {
    setError('Invalid credentials');
  }
};
```

### Step 3: Update AuthContext to Use Backend

```javascript
// src/components/context/AuthContext.jsx
import { loginUser as loginUserAPI, apiCall } from '../../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUserAPI(email, password);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateProfile = async (formData) => {
    try {
      const response = await apiCall('/users/profile', 'PUT', formData);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return true;
    } catch (error) {
      console.error('Update failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 3. Backend API Integration Points

### Expected Go Backend Endpoints:

#### Authentication Endpoints:
```
POST   /api/auth/login           (email, password) → token + user
POST   /api/auth/signup          (name, email, password, phone, role) → token + user
POST   /api/auth/logout          () → success
POST   /api/auth/refresh-token   (token) → new token
```

#### User Endpoints:
```
GET    /api/users/profile        → user details
PUT    /api/users/profile        (formData) → updated user
GET    /api/users/:id            → user by ID
```

#### Post Endpoints:
```
GET    /api/posts                → all posts (with filters)
POST   /api/posts                (title, description, images, etc) → created post
GET    /api/posts/:id            → single post details
PUT    /api/posts/:id            (updated data) → updated post
DELETE /api/posts/:id            → delete post
GET    /api/posts/user/:userId   → user's posts
```

#### Message Endpoints:
```
GET    /api/messages/:postId     → messages for a post
POST   /api/messages             (postId, message) → send message
```

### Example: Integrate Post Creation

```javascript
// src/components/pages/CreatePost.jsx
import { apiCall } from '../../services/api';

const handleSubmit = async (e) => {
  e.preventDefault();

  const newPost = {
    type: flatType,
    postType,
    area: formData.area,
    description: formData.description,
    images: imageUrls,
    rent: postType === 'offer' ? formData.rent : undefined,
    budget: postType === 'requirement' ? formData.budget : undefined,
    // ... other fields
  };

  try {
    const response = await apiCall('/posts', 'POST', newPost);
    alert('Post created successfully!');
    navigate('/listings');
  } catch (error) {
    alert('Error creating post: ' + error.message);
  }
};
```

### Example: Fetch Posts from Backend

```javascript
// src/components/pages/Listings.jsx
import { apiCall } from '../../services/api';

useEffect(() => {
  const fetchPosts = async () => {
    try {
      const data = await apiCall('/posts');
      setPosts(data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  fetchPosts();
}, []);
```

---

## 4. JWT Token Management

### Token Storage Strategy:
```javascript
// Best practice: Store token in httpOnly cookie (more secure)
// But for localStorage approach:

// Login response from Go backend should return:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "name": "John",
    "email": "john@example.com"
  }
}
```

### Auto Refresh Token:
```javascript
// src/services/api.js
let tokenRefreshPromise = null;

const refreshToken = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data.token;
};

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  let token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  let response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  
  if (response.status === 401) {
    // Token expired, refresh it
    token = await refreshToken();
    headers['Authorization'] = `Bearer ${token}`;
    response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
  }
  
  return response.json();
};
```

---

## 5. Go Backend Example Structure

### Main Go Backend Routes (Reference):
```go
package main

import (
    "github.com/gorilla/mux"
    "database/sql"
    _ "github.com/lib/pq"
)

func main() {
    db, _ := sql.Open("postgres", "postgres://user:password@localhost/livesync")
    defer db.Close()
    
    router := mux.NewRouter()
    
    // Auth routes
    router.HandleFunc("/api/auth/login", loginHandler).Methods("POST")
    router.HandleFunc("/api/auth/signup", signupHandler).Methods("POST")
    router.HandleFunc("/api/auth/refresh-token", refreshTokenHandler).Methods("POST")
    
    // User routes
    router.HandleFunc("/api/users/profile", getUserProfile).Methods("GET")
    router.HandleFunc("/api/users/profile", updateUserProfile).Methods("PUT")
    
    // Post routes
    router.HandleFunc("/api/posts", getPosts).Methods("GET")
    router.HandleFunc("/api/posts", createPost).Methods("POST")
    router.HandleFunc("/api/posts/{id}", getPost).Methods("GET")
    router.HandleFunc("/api/posts/{id}", deletePost).Methods("DELETE")
    
    http.ListenAndServe(":3001", router)
}
```

---

## 6. Environment Configuration

Create `.env` file in frontend root:
```
VITE_API_URL=http://localhost:3001/api
VITE_TOKEN_KEY=livesync_token
```

Update API service:
```javascript
const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY;
```

---

## 7. Security Checklist

- ✅ Use HTTPS in production
- ✅ Add request/response timeout
- ✅ Implement CORS properly
- ✅ Validate all inputs on both frontend and backend
- ✅ Use httpOnly cookies for tokens (if possible)
- ✅ Implement rate limiting on backend
- ✅ Add request logging
- ✅ Use environment variables for API URLs

---

## Summary

1. **Frontend Setup**: Create API service with token management
2. **Authentication**: Use JWT tokens stored in localStorage
3. **API Calls**: Use apiCall() wrapper for all requests
4. **Token Refresh**: Auto-refresh expired tokens
5. **Error Handling**: Handle 401 responses by redirecting to login
6. **Context**: Update AuthContext to use backend API
7. **Components**: Replace localStorage mock data with API calls