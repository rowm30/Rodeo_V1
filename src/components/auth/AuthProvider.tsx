'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { AuthState, checkAuthStatus, refreshSession } from '@/lib/client/auth';

interface AuthContextType extends AuthState {
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    loading: true,
  });

  const refresh = async () => {
    const newState = await checkAuthStatus();
    setAuthState(newState);
  };

  useEffect(() => {
    refresh();

    // Set up automatic session refresh
    const interval = setInterval(
      async () => {
        if (authState.authenticated) {
          const refreshed = await refreshSession();
          if (!refreshed) {
            // Session couldn't be refreshed, check status
            await refresh();
          }
        }
      },
      10 * 60 * 1000,
    ); // Refresh every 10 minutes

    return () => clearInterval(interval);
  }, [authState.authenticated]);

  const contextValue: AuthContextType = {
    ...authState,
    refresh,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
