/**
 * @jest-environment jsdom
 */

import {
  clearStoredKeys,
  exportPublicKeyJWK,
  generateKeyPair,
  initializeDevice,
  signChallenge,
  storePrivateKey,
} from './keyManager';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock crypto.subtle
const mockKeyPair = {
  publicKey: { type: 'public' },
  privateKey: { type: 'private' },
};

const mockJWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'test-x',
  y: 'test-y',
};

const mockSignature = new ArrayBuffer(64);

beforeEach(async () => {
  jest.clearAllMocks();

  // Reset crypto.subtle mocks
  (crypto.subtle.generateKey as jest.Mock).mockResolvedValue(mockKeyPair);
  (crypto.subtle.exportKey as jest.Mock).mockResolvedValue(mockJWK);
  (crypto.subtle.importKey as jest.Mock).mockResolvedValue(
    mockKeyPair.privateKey,
  );
  (crypto.subtle.sign as jest.Mock).mockResolvedValue(mockSignature);

  await clearStoredKeys();
});

describe('Key Manager', () => {
  describe('generateKeyPair', () => {
    it('should generate an ECDSA P-256 key pair', async () => {
      const keyPair = await generateKeyPair();

      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify'],
      );

      expect(keyPair).toEqual(mockKeyPair);
    });
  });

  describe('exportPublicKeyJWK', () => {
    it('should export public key as JWK', async () => {
      const jwk = await exportPublicKeyJWK(
        mockKeyPair.publicKey as unknown as CryptoKey,
      );

      expect(crypto.subtle.exportKey).toHaveBeenCalledWith(
        'jwk',
        mockKeyPair.publicKey,
      );
      expect(jwk).toEqual(mockJWK);
    });
  });

  describe('signChallenge', () => {
    it('should sign a challenge with the private key', async () => {
      const nonce = 'test-nonce';

      // Store a private key first
      await storePrivateKey(mockKeyPair.privateKey as unknown as CryptoKey);

      (crypto.subtle.exportKey as jest.Mock).mockResolvedValueOnce(mockJWK);

      const signature = await signChallenge(nonce);

      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should throw error if no private key found', async () => {
      // Ensure no key is stored
      await clearStoredKeys();

      await expect(signChallenge('test-nonce')).rejects.toThrow(
        'No private key found',
      );
    });
  });

  describe('initializeDevice', () => {
    it('should register device and return device ID', async () => {
      const mockDeviceId = 'test-device-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deviceId: mockDeviceId }),
      });

      const deviceId = await initializeDevice();

      expect(fetch).toHaveBeenCalledWith('/api/device/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicKeyJwk: mockJWK }),
      });

      expect(deviceId).toBe(mockDeviceId);
    });

    it('should throw error if registration fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(initializeDevice()).rejects.toThrow(
        'Device registration failed: Bad Request',
      );
    });
  });
});
