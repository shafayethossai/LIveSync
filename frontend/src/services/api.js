import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "https://livesync-46l3.onrender.com"}/api`, // This is where your Go backend will run
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Automatically add JWT token to every request
api.interceptors.request.use(
  (config) => {
    // Check for admin token first (from sessionStorage), then user token (from localStorage)
    const adminToken = sessionStorage.getItem("admin_token");
    const userToken = localStorage.getItem("token");
    const tokenToUse = adminToken || userToken;

    if (tokenToUse) {
      config.headers.Authorization = `Bearer ${tokenToUse}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle 401 Unauthorized (auto logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check which token was used and clear accordingly
      const adminToken = sessionStorage.getItem("admin_token");
      if (adminToken) {
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("livesync_admin");
        window.location.href = "/admin/login";
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("livesync_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
