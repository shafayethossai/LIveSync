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
      
      // Validate response has required fields
      if (!userData.id || !userData.email) {
        throw new Error('Invalid user data structure');
      }
      
      // Update both state and localStorage
      setUser(userData);
      localStorage.setItem('livesync_user', JSON.stringify(userData));
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => { // login function to authenticate user and store token
    try {
      const response = await api.post('/users/login', { email, password });
      const { token, user: userData } = response.data;

      // Validate response has required fields
      if (!userData.id || !userData.email || !token) {
        throw new Error('Invalid login response from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('livesync_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Invalid email or password';
      return { success: false, message };
    }
  };

  const signup = async (name, email, password, phone = '') => { // OLD: instant signup function to create new user account
    try {
      const response = await api.post('/users', { name, email, password, phone });
      const userData = response.data;
      
      if (!userData.id || !userData.email) {
        throw new Error('Invalid signup response from server');
      }
      
      return { 
        success: true, 
        message: 'Account created successfully! Please login.',
        user: userData
      };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Signup failed';
      return { success: false, message };
    }
  };

  const requestOTP = async (name, email, password, phone = '') => { // OTP signup: Step 1 - Request OTP
    try {
      const response = await api.post('/auth/signup/request-otp', { 
        name, 
        email, 
        password, 
        phone 
      });
      
      return { 
        success: true, 
        message: response.data.message,
        email: response.data.email
      };
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to send OTP';
      return { success: false, message };
    }
  };

  const verifyOTP = async (email, otp) => { // OTP signup: Step 2 - Verify OTP and create account
    try {
      const response = await api.post('/auth/signup/verify-otp', { email, otp });
      const { token, user: userData } = response.data;

      // Validate response has required fields
      if (!userData.id || !userData.email || !token) {
        throw new Error('Invalid verification response from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('livesync_user', JSON.stringify(userData));
      setUser(userData);

      return { 
        success: true, 
        message: response.data.message,
        user: userData 
      };
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'OTP verification failed';
      return { success: false, message };
    }
  };

  const resendOTP = async (email) => { // OTP signup: Resend OTP if expired
    try {
      const response = await api.post('/auth/signup/resend-otp', { email });
      
      return { 
        success: true, 
        message: response.data.message,
        email: response.data.email
      };
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to resend OTP';
      return { success: false, message };
    }
  };

  const updateProfile = async (profileData) => { // update user profile function
    try {
      const response = await api.put('/user/profile', profileData);
      
      // Backend returns user object directly: { id, name, email, phone, avatar_url, role, created_at }
      const updatedUser = response.data;
      
      if (!updatedUser || !updatedUser.id || !updatedUser.email) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      // UPDATE STATE FIRST
      setUser(updatedUser);
      
      // UPDATE LOCALSTORAGE
      localStorage.setItem('livesync_user', JSON.stringify(updatedUser));
      
      return { success: true, message: 'Profile updated successfully', user: updatedUser };
    } catch (error) {
      // Check if it's a 401 (unauthorized - token expired)
      if (error.response?.status === 401) {
        logout();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const message = error.response?.data?.error || error.message || 'Profile update failed';
      return { success: false, message };
    }
  };

  const logout = () => { // logout function to clear user data and token
    localStorage.removeItem('token');
    localStorage.removeItem('livesync_user');
    setUser(null);
  };

  const googleLogin = async (idToken) => { // Google OAuth login function
    try {
      const response = await api.post('/auth/google/signin', { id_token: idToken });
      const { token, user: userData } = response.data;

      // Validate response has required fields
      if (!userData.id || !userData.email || !token) {
        throw new Error('Invalid login response from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('livesync_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Google login failed';
      return { success: false, message };
    }
  };

  return {
    user,
    loading,
    login,
    signup,           // OLD: instant signup
    requestOTP,       // NEW: OTP signup step 1
    verifyOTP,        // NEW: OTP signup step 2
    resendOTP,        // NEW: Resend OTP
    logout,
    googleLogin,      // Google OAuth login function
    updateProfile,    // update profile function
    fetchCurrentUser, // useful for protected routes
  };
};
