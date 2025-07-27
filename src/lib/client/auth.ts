'use client';

import {
  clearStoredKeys,
  hasStoredKeys,
  initializeDevice,
  signChallenge,
} from './keyManager';

export interface AuthState {
  authenticated: boolean;
  deviceId?: string;
  loading: boolean;
  error?: string;
}

/**
 * Perform device authentication flow
 */
export async function authenticateDevice(): Promise<AuthState> {
  try {
    // Initialize device (generate keys if needed, register device)
    const deviceId = await initializeDevice();

    // Request challenge
    const challengeResponse = await fetch('/api/auth/challenge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId }),
    });

    if (!challengeResponse.ok) {
      const error = await challengeResponse.json();
      throw new Error(error.error || 'Challenge request failed');
    }

    const { challengeId, nonce } = await challengeResponse.json();

    // Sign challenge
    const signature = await signChallenge(nonce);

    // Verify signature
    const verifyResponse = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        challengeId,
        signature,
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.error || 'Authentication failed');
    }

    return {
      authenticated: true,
      deviceId,
      loading: false,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      loading: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Check current authentication status
 */
export async function checkAuthStatus(): Promise<AuthState> {
  try {
    const response = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return {
        authenticated: false,
        loading: false,
      };
    }

    const { authenticated, deviceId } = await response.json();

    return {
      authenticated,
      deviceId,
      loading: false,
    };
  } catch (error) {
    console.error('Auth status check error:', error);
    return {
      authenticated: false,
      loading: false,
      error: error instanceof Error ? error.message : 'Status check failed',
    };
  }
}

/**
 * Refresh session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Reset device (clear keys and logout)
 */
export async function resetDevice(): Promise<void> {
  try {
    await logout();
    await clearStoredKeys();
  } catch (error) {
    console.error('Device reset error:', error);
  }
}

/**
 * Check if device is set up (has keys)
 */
export async function isDeviceSetUp(): Promise<boolean> {
  return await hasStoredKeys();
}
