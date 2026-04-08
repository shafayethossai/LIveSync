// src/hooks/auth/useAuth.js
import { useState, useEffect } from 'react';
import api from '../../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { // Load user on app start if token exists
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => { // getting current user info using token
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error("Token invalid or expired");
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => { // login function to authenticate user and store token
    try {
      const response = await api.post('/users/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('livesync_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Invalid email or password';
      return { success: false, message };
    }
  };

  const signup = async (name, email, password, phone = '') => { // signup function to create new user account
    try {
      const response = await api.post('/users', { name, email, password, phone });
      return { 
        success: true, 
        message: 'Account created successfully! Please login.' 
      };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Signup failed';
      return { success: false, message };
    }
  };

  const logout = () => { // logout function to clear user data and token
    localStorage.removeItem('token');
    localStorage.removeItem('livesync_user');
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    fetchCurrentUser,   // useful for protected routes
  };
};