import {
  generateJWKThumbprint,
  generateNonce,
  signSessionCookie,
  validateECDSAP256JWK,
  verifySessionCookie,
} from './crypto';

describe('Crypto utilities', () => {
  describe('generateJWKThumbprint', () => {
    it('should generate a thumbprint for ECDSA P-256 key', async () => {
      const jwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x',
        y: 'test-y',
      };

      const thumbprint = await generateJWKThumbprint(jwk);
      expect(typeof thumbprint).toBe('string');
      expect(thumbprint.length).toBeGreaterThan(0);
    });
  });

  describe('generateNonce', () => {
    it('should generate a base64url encoded nonce', () => {
      const nonce = generateNonce();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });
  });

  describe('signSessionCookie and verifySessionCookie', () => {
    const sessionId = 'test-session-id';
    const secret = 'test-secret';

    it('should sign and verify a session cookie', async () => {
      const signedCookie = await signSessionCookie(sessionId, secret);
      expect(signedCookie).toContain(sessionId);
      expect(signedCookie).toContain('.');

      const verifiedSessionId = await verifySessionCookie(signedCookie, secret);
      expect(verifiedSessionId).toBe(sessionId);
    });

    it('should return null for invalid signature', async () => {
      const signedCookie = `${sessionId}.invalid-signature`;
      const result = await verifySessionCookie(signedCookie, secret);
      expect(result).toBeNull();
    });

    it('should return null for malformed cookie', async () => {
      const malformedCookie = 'invalid-cookie-format';
      const result = await verifySessionCookie(malformedCookie, secret);
      expect(result).toBeNull();
    });
  });

  describe('validateECDSAP256JWK', () => {
    it('should validate a correct ECDSA P-256 JWK', () => {
      const validJWK = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x',
        y: 'test-y',
        use: 'sig',
      };

      expect(validateECDSAP256JWK(validJWK)).toBe(true);
    });

    it('should reject invalid JWK', () => {
      const invalidJWK = {
        kty: 'RSA', // Wrong key type
        crv: 'P-256',
        x: 'test-x',
        y: 'test-y',
      };

      expect(validateECDSAP256JWK(invalidJWK)).toBe(false);
    });

    it('should reject JWK with missing required fields', () => {
      const incompleteJWK = {
        kty: 'EC',
        crv: 'P-256',
        // Missing x and y
      };

      expect(validateECDSAP256JWK(incompleteJWK)).toBe(false);
    });
  });
});
