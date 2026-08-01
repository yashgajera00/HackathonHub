import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial user state
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined') {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);

    // Sync latest user status/permissions from backend
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/users/profile/')
        .then((response) => {
          setUser((prev) => {
            const updated = {
              ...prev,
              ...response.data
            };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        })
        .catch((err) => {
          console.error("Failed to sync user profile on initialization", err);
        });
    }
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    const { access, refresh, user: userData } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register/', data);
    const { access, refresh, user: userData } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (e) {
      console.warn("Logout failed on backend, clearing storage anyway", e);
    }
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('active_hackathon_id');
    localStorage.removeItem('active_hackathon_role');
    
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    // profileData can be FormData for uploading avatars
    const isFormData = profileData instanceof FormData;
    const response = await api.put('/users/profile/', profileData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    
    const updatedUser = {
      ...user,
      first_name: response.data.first_name,
      last_name: response.data.last_name,
      phone: response.data.phone,
      avatar: response.data.avatar,
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const refreshUser = async () => {
    const response = await api.get('/users/profile/');
    const updatedUser = {
      ...user,
      ...response.data
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
