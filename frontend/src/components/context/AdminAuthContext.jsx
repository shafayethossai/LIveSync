import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../services/api';

const AdminAuthContext = createContext(undefined);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load admin from localStorage on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem('livesync_admin');
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch (e) {
        console.error('Failed to parse admin data');
        setAdmin(null);
      }
    }
    setLoading(false);
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      // Call backend login API
      const response = await api.post('/admin/login', { email, password });
      
      if (response.data && response.data.token) {
        const adminData = {
          id: response.data.admin?.id || 1,
          name: response.data.admin?.name || 'Admin User',
          email: response.data.admin?.email || email,
          role: response.data.admin?.role || 'admin'
        };
        
        // Store token and admin data in localStorage
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('livesync_admin', JSON.stringify(adminData));
        
        setAdmin(adminData);
        return { success: true, message: 'Login successful' };
      } else {
        return { 
          success: false, 
          message: 'Invalid response from server' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const signupAdmin = async (name, email, password, phone) => {
    // Admin signup is disabled
    return { 
      success: false, 
      message: 'Admin signup is disabled. Contact administrator.' 
    };
  };

  const logoutAdmin = () => {
    setAdmin(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('livesync_admin');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, loginAdmin, signupAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}