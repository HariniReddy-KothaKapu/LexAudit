import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('lexaudit_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('lexaudit_token', token);
    localStorage.setItem('lexaudit_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
  const res = await authAPI.register({ name, email, password });
  console.log("REGISTER RESPONSE:", res.data); // ADD THIS
  return res.data;
};

  const logout = () => {
    localStorage.removeItem('lexaudit_token');
    localStorage.removeItem('lexaudit_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('lexaudit_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
