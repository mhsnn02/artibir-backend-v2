import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api_service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authService.getMe();
          setUser(response.data);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    const userResponse = await authService.getMe();
    setUser(userResponse.data);
    return userResponse.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
      try {
          const userResponse = await authService.getMe();
          setUser(userResponse.data);
      } catch (err) {
          console.error("User refresh failed", err);
      }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
