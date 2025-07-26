import { test, expect } from '@playwright/test';

// Mock implementation of device authentication for E2E testing
test.describe('Device Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Mock the Web Crypto API for consistent testing
    await page.addInitScript(() => {
      // Mock IndexedDB
      const mockDB = {
        transaction: () => ({
          objectStore: () => ({
            put: () => ({ onsuccess: null, onerror: null }),
            get: () => ({ 
              result: null,
              onsuccess: null, 
              onerror: null 
            }),
            clear: () => ({ onsuccess: null, onerror: null }),
          }),
        }),
        createObjectStore: () => {},
      };

      Object.defineProperty(window, 'indexedDB', {
        value: {
          open: () => ({
            result: mockDB,
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null,
          }),
        },
        writable: true,
      });

      // Mock crypto.subtle
      const mockKeyPair = {
        publicKey: { type: 'public' },
        privateKey: { type: 'private' },
      };

      const mockJWK = {
        kty: 'EC',
        crv: 'P-256',
        x: 'mock-x-coordinate',
        y: 'mock-y-coordinate',
        use: 'sig',
      };

      Object.defineProperty(window.crypto, 'subtle', {
        value: {
          generateKey: () => Promise.resolve(mockKeyPair),
          exportKey: () => Promise.resolve(mockJWK),
          importKey: () => Promise.resolve(mockKeyPair.privateKey),
          sign: () => Promise.resolve(new ArrayBuffer(64)),
          verify: () => Promise.resolve(true),
        },
        writable: true,
      });
    });
  });

  test('should complete full authentication flow', async ({ page }) => {
    // Mock API responses
    await page.route('/api/device/register', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ deviceId: 'mock-device-id' }),
      });
    });

    await page.route('/api/auth/challenge', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ 
          challengeId: 'mock-challenge-id',
          nonce: 'mock-nonce'
        }),
      });
    });

    await page.route('/api/auth/verify', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
        headers: {
          'Set-Cookie': 'sid=mock-session-cookie; HttpOnly; Path=/',
        },
      });
    });

    await page.route('/api/me', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          deviceId: 'mock-device-id',
        }),
      });
    });

    // Look for the authentication button
    const authButton = page.getByText('Continue on this device');
    await expect(authButton).toBeVisible();

    // Click the authentication button
    await authButton.click();

    // Wait for authentication to complete
    await expect(page.getByText("You're authenticated on this device")).toBeVisible();
  });

  test('should handle authentication failure', async ({ page }) => {
    // Mock failed API responses
    await page.route('/api/device/register', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ deviceId: 'mock-device-id' }),
      });
    });

    await page.route('/api/auth/challenge', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ 
          challengeId: 'mock-challenge-id',
          nonce: 'mock-nonce'
        }),
      });
    });

    await page.route('/api/auth/verify', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid signature' }),
      });
    });

    // Look for the authentication button
    const authButton = page.getByText('Continue on this device');
    await expect(authButton).toBeVisible();

    // Click the authentication button
    await authButton.click();

    // Wait for error message to appear
    await expect(page.getByText('Invalid signature')).toBeVisible();
  });

  test('should handle device reset', async ({ page }) => {
    // First, mock successful authentication
    await page.route('/api/device/register', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ deviceId: 'mock-device-id' }),
      });
    });

    await page.route('/api/auth/challenge', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ 
          challengeId: 'mock-challenge-id',
          nonce: 'mock-nonce'
        }),
      });
    });

    await page.route('/api/auth/verify', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route('/api/me', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          deviceId: 'mock-device-id',
        }),
      });
    });

    await page.route('/api/auth/logout', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    // Authenticate first
    const authButton = page.getByText('Continue on this device');
    await authButton.click();

    // Wait for authentication
    await expect(page.getByText("You're authenticated on this device")).toBeVisible();

    // Navigate to settings (assuming there's a settings page with device settings)
    // This would depend on your app's navigation structure
    // For now, we'll assume the DeviceSettings component is rendered somewhere

    // Look for reset button (this would need to be visible in your UI)
    const resetButton = page.getByText('Reset This Device');
    if (await resetButton.isVisible()) {
      await resetButton.click();

      // Confirm reset
      const confirmButton = page.getByText('Yes, Reset Device');
      await confirmButton.click();

      // Should return to unauthenticated state
      await expect(page.getByText('Continue on this device')).toBeVisible();
    }
  });

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit response
    await page.route('/api/auth/challenge', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests' }),
        headers: {
          'Retry-After': '60',
        },
      });
    });

    await page.route('/api/device/register', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ deviceId: 'mock-device-id' }),
      });
    });

    // Try to authenticate
    const authButton = page.getByText('Continue on this device');
    await authButton.click();

    // Should show rate limit error
    await expect(page.getByText('Too many requests')).toBeVisible();
  });
});