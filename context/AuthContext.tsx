import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';
import * as Mock from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, role: UserRole) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (email: string, role: UserRole) => {
    let user: User | undefined;
    
    // Simulate finding user in mock db
    switch (role) {
      case UserRole.ADMIN:
        user = Mock.ADMINS.find(u => u.email === email);
        if (!user) user = Mock.ADMINS[0]; // Fallback for demo
        break;
      case UserRole.TEACHER:
        user = Mock.TEACHERS.find(u => u.email === email);
        if (!user) user = Mock.TEACHERS[0];
        break;
      case UserRole.STUDENT:
        user = Mock.STUDENTS.find(u => u.email === email);
        if (!user) user = Mock.STUDENTS[0];
        break;
      case UserRole.PARENT:
        user = Mock.PARENTS.find(u => u.email === email);
        if (!user) user = Mock.PARENTS[0];
        break;
    }

    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
