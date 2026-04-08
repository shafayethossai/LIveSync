import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3002/api',   // This is where your Go backend will run
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add JWT token to every request
api.interceptors.request.use(
  (config) => {
    // Check for admin token first, then user token
    const adminToken = localStorage.getItem('admin_token');
    const userToken = localStorage.getItem('token');
    const tokenToUse = adminToken || userToken;
    
    if (tokenToUse) {
      config.headers.Authorization = `Bearer ${tokenToUse}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 Unauthorized (auto logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check which token was used and clear accordingly
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('livesync_admin');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('livesync_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;