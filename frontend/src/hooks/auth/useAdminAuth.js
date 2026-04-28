// src/hooks/auth/useAdminAuth.js
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentAdmin = useCallback(async () => {
    try {
      const response = await api.get("/admins/me");
      setAdmin(response.data);
    } catch {
      console.error("Admin token invalid or expired");
      logoutAdmin();
    } finally {
      setLoading(false);
    }
  }, []);

  // Load admin on app start if token exists
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      fetchCurrentAdmin();
    } else {
      setLoading(false);
    }
  }, [fetchCurrentAdmin]);

  const loginAdmin = async (email, password) => {
    try {
      const response = await api.post("/admins/login", { email, password });
      const { token, admin: adminData } = response.data;

      localStorage.setItem("admin_token", token);
      localStorage.setItem("livesync_admin", JSON.stringify(adminData));
      setAdmin(adminData);

      return { success: true, admin: adminData };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid email or password";
      return { success: false, message };
    }
  };

  const signupAdmin = async (name, email, password, phone = "") => {
    try {
      await api.post("/admins", { name, email, password, phone });
      return {
        success: true,
        message: "Admin account created successfully! Please login.",
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Signup failed";
      return { success: false, message };
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("livesync_admin");
    setAdmin(null);
  };

  return {
    admin,
    loading,
    loginAdmin,
    signupAdmin,
    logoutAdmin,
    fetchCurrentAdmin,
  };
};
