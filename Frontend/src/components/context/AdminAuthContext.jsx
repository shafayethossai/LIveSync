import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(undefined);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('livesync_admin');
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
    setIsLoading(false);
  }, []);

  const loginAdmin = (email, password) => {
    if (email === 'admin@livesync.com' && password === 'admin123') {
      const adminUser = {
        id: 'admin_1',
        name: 'Admin User',
        email: email,
      };
      setAdmin(adminUser);
      localStorage.setItem('livesync_admin', JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setAdmin(null);
    localStorage.removeItem('livesync_admin');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loginAdmin, logoutAdmin, isLoading }}>
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