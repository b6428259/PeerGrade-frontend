'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import secureLocalStorage from "react-secure-storage";

export interface User {
  _id: string;    // ใช้ _id เป็นหลัก
  id: string;     // คงไว้เพื่อ backward compatibility
  name: string;
  role: string; 
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchUser: (token: string) => Promise<void>;
  isLoading: boolean;
  userId: string | null;  // เพิ่ม userId field สำหรับเข้าถึงง่าย
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // เพิ่ม userId state เพื่อให้เข้าถึงง่าย
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const id = secureLocalStorage.getItem('userId');
      return typeof id === 'string' ? id : null;
    }
    return null;
  });

  const login = useCallback((token: string, userData: User) => {
    // บันทึก user ID 
    if (userData && (userData._id || userData.id)) {
      const id = userData._id || userData.id;
      secureLocalStorage.setItem('userId', id);
      setUserId(id);
    }
    
    // บันทึก token ใน localStorage
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await axios.post('http://localhost:5000/api/users/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      // ล้างข้อมูล local
      localStorage.removeItem('token');
      secureLocalStorage.removeItem('userId');
      setIsAuthenticated(false);
      setUser(null);
      setUserId(null);
    }
  }, []);
  
  const fetchUser = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.user) {
        setUser(response.data.user);
        
        // กำหนด userId โดยตรงจากการตรวจสอบ
        const id = response.data.user._id || response.data.user.id;
        if (id) {
          secureLocalStorage.setItem('userId', id);
          setUserId(id);
        } else {
          console.error('User data does not contain valid ID');
          logout();
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, [fetchUser, user]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      fetchUser, 
      isLoading,
      userId  // ส่งต่อค่า userId ออกไป
    }}>
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