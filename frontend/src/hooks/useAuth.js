import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('npm_token');
    const savedUser = localStorage.getItem('npm_user');
    const savedRole = localStorage.getItem('npm_role');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  function login(token, userData, userRole) {
    localStorage.setItem('npm_token', token);
    localStorage.setItem('npm_user', JSON.stringify(userData));
    localStorage.setItem('npm_role', userRole);
    setUser(userData);
    setRole(userRole);
  }

  function logout() {
    localStorage.removeItem('npm_token');
    localStorage.removeItem('npm_user');
    localStorage.removeItem('npm_role');
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
