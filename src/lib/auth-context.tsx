'use client';

import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';

interface User {
  id: string;
  email: string;
  role: 'coach' | 'family' | 'admin';
  firstName: string;
  lastName: string;
  clubId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const verifyToken = useCallback(async (tokenToVerify: string) => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: tokenToVerify }),
        });

        if (response.ok) {
          const decoded = await response.json();
          setUser({
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            firstName: decoded.firstName || '',
            lastName: decoded.lastName || '',
            clubId: decoded.clubId,
          });
          setToken(tokenToVerify);
        } else {
          // Token is invalid, clear it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        verifyToken(storedToken);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [verifyToken]);


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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
