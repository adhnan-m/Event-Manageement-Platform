import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, updateUserProfile } from '@/app/utils/api';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount via stored token
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUser()
        .then((userData) => {
          setUserState(userData);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('token', data.token);
      setUserState(data.user);
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, name, role) => {
    setIsLoading(true);
    try {
      const data = await registerUser(email, password, name, role);
      localStorage.setItem('token', data.token);
      setUserState(data.user);
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem('token');
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await updateUserProfile(updates);
      setUserState(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};