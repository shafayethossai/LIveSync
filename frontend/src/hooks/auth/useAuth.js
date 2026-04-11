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
      const userData = response.data;
      
      // Update both state and localStorage
      setUser(userData);
      localStorage.setItem('livesync_user', JSON.stringify(userData));
      
      console.log('User data fetched:', userData);
    } catch (error) {
      console.error("Token invalid or expired", error);
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

  const updateProfile = async (profileData) => { // update user profile function
    try {
      const response = await api.put('/user/profile', profileData);
      const updatedUser = response.data.user || response.data;
      
      localStorage.setItem('livesync_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, message: 'Profile updated successfully', user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
      const message = error.response?.data?.message || error.response?.data?.error || 'Profile update failed';
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
    updateProfile,      // update profile function
    fetchCurrentUser,   // useful for protected routes
  };
};