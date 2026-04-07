import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('livesync_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = (email, password) => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: email,
      phone: '+880 1234567890',
      role: 'owner',
    };
    setUser(mockUser);
    localStorage.setItem('livesync_user', JSON.stringify(mockUser));
    return true;
  };

  const signup = (name, email, password, phone = '') => {
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
      phone: phone,
      role: 'tenant',
    };
    setUser(newUser);
    localStorage.setItem('livesync_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('livesync_user');
  };

  const updateProfile = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('livesync_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}