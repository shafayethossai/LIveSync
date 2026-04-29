// src/hooks/auth/useAdminAuth.js
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutAdmin = useCallback(() => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("livesync_admin");
    setAdmin(null);
  }, []);

  const fetchCurrentAdmin = useCallback(async () => {
    const savedAdmin = sessionStorage.getItem("livesync_admin");
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch (error) {
        console.error("Failed to parse saved admin data", error);
        logoutAdmin();
      }
    }
    setLoading(false);
  }, [logoutAdmin]);

  // Load admin on app start if token exists
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentAdmin();
  }, [fetchCurrentAdmin]);

  const loginAdmin = async (email, password) => {
    try {
      const response = await api.post("/admin/login", { email, password });
      const { token, admin: adminData } = response.data;

      sessionStorage.setItem("admin_token", token);
      sessionStorage.setItem("livesync_admin", JSON.stringify(adminData));
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

  const signupAdmin = async () => {
    return {
      success: false,
      message:
        "Admin signup is not available. Please use the existing admin account.",
    };
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
