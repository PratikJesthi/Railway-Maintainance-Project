import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, getToken, setToken, clearToken } from '../api/client.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMe = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) setUser(await res.json());
      else clearToken();
    } catch (_) {
      // backend unreachable — treat as logged out rather than crash the app
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  useEffect(() => {
    const onUnauth = () => setUser(null);
    window.addEventListener('sanchalan:unauthorized', onUnauth);
    return () => window.removeEventListener('sanchalan:unauthorized', onUnauth);
  }, []);

  const login = useCallback(async (employeeId, password) => {
    setError('');
    let res;
    try {
      res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ employee_id: employeeId, password }),
      });
    } catch (_) {
      setError('Cannot reach the auth server — check the backend is running.');
      return false;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || 'Login failed — check your employee ID and password.');
      return false;
    }
    const { access_token } = await res.json();
    setToken(access_token);
    await loadMe();
    return true;
  }, [loadMe]);

  const register = useCallback(async ({ employeeId, name, password, role, departments }) => {
    setError('');
    let res;
    try {
      res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: employeeId,
          name,
          password,
          role: role || 'requester',
          departments: departments || ['ENG'],
        }),
      });
    } catch (_) {
      setError('Cannot reach the auth server — check the backend is running.');
      return false;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || 'Registration failed.');
      return false;
    }
    const { access_token } = await res.json();
    setToken(access_token);
    await loadMe();
    return true;
  }, [loadMe]);

  const forgotPassword = useCallback(async (employeeId) => {
    setError('');
    let res;
    try {
      res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ employee_id: employeeId }),
      });
    } catch (_) {
      setError('Cannot reach the auth server.');
      return null;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || 'Failed to request password reset.');
      return null;
    }
    return await res.json();
  }, []);

  const resetPassword = useCallback(async (employeeId, newPassword, resetToken) => {
    setError('');
    let res;
    try {
      res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: employeeId,
          new_password: newPassword,
          reset_token: resetToken || null,
        }),
      });
    } catch (_) {
      setError('Cannot reach the auth server.');
      return false;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || 'Password reset failed.');
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, error, setError, login, register, forgotPassword, resetPassword, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
