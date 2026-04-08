import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook } from '../../hooks/auth/useAuth';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
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