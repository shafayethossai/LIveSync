import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(undefined);

// Fixed admin credentials
const FIXED_ADMIN = {
  email: 'admin@example.com',
  password: 'Admin@123',
  id: 'admin-001',
  name: 'Admin User',
  role: 'admin'
};

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
      // Simulate async operation with slight delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check against fixed credentials
      if (email === FIXED_ADMIN.email && password === FIXED_ADMIN.password) {
        const adminData = {
          id: FIXED_ADMIN.id,
          name: FIXED_ADMIN.name,
          email: FIXED_ADMIN.email,
          role: FIXED_ADMIN.role
        };
        
        // Store in localStorage
        localStorage.setItem('admin_token', 'fixed-admin-token-' + Date.now());
        localStorage.setItem('livesync_admin', JSON.stringify(adminData));
        
        setAdmin(adminData);
        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const signupAdmin = async (name, email, password, phone) => {
    // Admin signup is disabled - use fixed credentials to login
    return { 
      success: false, 
      message: 'Admin signup is disabled. Use your fixed credentials to login.' 
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