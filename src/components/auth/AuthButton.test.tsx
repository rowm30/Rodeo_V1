/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import * as authModule from '@/lib/client/auth';

import { AuthButton } from './AuthButton';
import { AuthProvider } from './AuthProvider';

// Mock the auth module
jest.mock('@/lib/client/auth');
const mockAuthenticateDevice =
  authModule.authenticateDevice as jest.MockedFunction<
    typeof authModule.authenticateDevice
  >;
const mockCheckAuthStatus = authModule.checkAuthStatus as jest.MockedFunction<
  typeof authModule.checkAuthStatus
>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const renderWithProvider = (authenticated = false) => {
  mockCheckAuthStatus.mockResolvedValue({
    authenticated,
    loading: false,
    deviceId: authenticated ? 'test-device-id' : undefined,
  });

  return render(
    <AuthProvider>
      <AuthButton />
    </AuthProvider>,
  );
};

describe('AuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show "Continue on this device" button when not authenticated', async () => {
    renderWithProvider(false);

    await waitFor(() => {
      expect(screen.getByText('Continue on this device')).toBeInTheDocument();
    });
  });

  it('should show authenticated status when authenticated', async () => {
    renderWithProvider(true);

    await waitFor(() => {
      expect(
        screen.getByText("You're authenticated on this device"),
      ).toBeInTheDocument();
    });
  });

  it('should handle authentication flow', async () => {
    mockAuthenticateDevice.mockResolvedValueOnce({
      authenticated: true,
      deviceId: 'test-device-id',
      loading: false,
    });

    renderWithProvider(false);

    await waitFor(() => {
      expect(screen.getByText('Continue on this device')).toBeInTheDocument();
    });

    const button = screen.getByText('Continue on this device');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });

    expect(mockAuthenticateDevice).toHaveBeenCalledTimes(1);
  });

  it('should display error message on authentication failure', async () => {
    const errorMessage = 'Authentication failed';
    mockAuthenticateDevice.mockResolvedValueOnce({
      authenticated: false,
      loading: false,
      error: errorMessage,
    });

    renderWithProvider(false);

    await waitFor(() => {
      expect(screen.getByText('Continue on this device')).toBeInTheDocument();
    });

    const button = screen.getByText('Continue on this device');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should disable button during loading', async () => {
    mockAuthenticateDevice.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProvider(false);

    await waitFor(() => {
      expect(screen.getByText('Continue on this device')).toBeInTheDocument();
    });

    const button = screen.getByText('Continue on this device');
    fireEvent.click(button);

    await waitFor(() => {
      const loadingButton = screen.getByText('Authenticating...');
      expect(loadingButton).toBeDisabled();
    });
  });
});
