import { createHash, randomBytes } from 'crypto';

/**
 * Generate a JWK thumbprint according to RFC 7638
 * For ECDSA P-256 keys, we use the canonical JWK representation
 */
export function generateJWKThumbprint(jwk: JsonWebKey): string {
  // For ECDSA P-256, canonical representation includes: crv, kty, x, y
  const canonical = {
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  };
  
  const canonicalString = JSON.stringify(canonical);
  return createHash('sha256').update(canonicalString, 'utf8').digest('base64url');
}

/**
 * Generate a secure random nonce for challenges
 */
export function generateNonce(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Import a JWK public key for verification using Node.js WebCrypto
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['verify']
  );
}

/**
 * Verify an ECDSA P-256 signature using the stored public key
 */
export async function verifySignature(
  publicKeyJwk: JsonWebKey,
  nonce: string,
  signature: string
): Promise<boolean> {
  try {
    const publicKey = await importPublicKey(publicKeyJwk);
    
    // Convert base64url signature to ArrayBuffer
    const signatureBuffer = Buffer.from(signature, 'base64url');
    
    // Convert nonce to ArrayBuffer for verification
    const nonceBuffer = new TextEncoder().encode(nonce);
    
    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      publicKey,
      signatureBuffer,
      nonceBuffer
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Create a session cookie value with HMAC signature
 */
export function signSessionCookie(sessionId: string, secret: string): string {
  const hmac = createHash('sha256');
  hmac.update(`${sessionId}.${secret}`);
  const signature = hmac.digest('base64url');
  return `${sessionId}.${signature}`;
}

/**
 * Verify and extract session ID from signed cookie
 */
export function verifySessionCookie(signedCookie: string, secret: string): string | null {
  try {
    const [sessionId, signature] = signedCookie.split('.');
    if (!sessionId || !signature) return null;
    
    const expectedCookie = signSessionCookie(sessionId, secret);
    const [, expectedSignature] = expectedCookie.split('.');
    
    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return null;
    
    let match = 0;
    for (let i = 0; i < signature.length; i++) {
      match |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return match === 0 ? sessionId : null;
  } catch {
    return null;
  }
}

/**
 * Validate JWK format for ECDSA P-256 keys
 */
export function validateECDSAP256JWK(jwk: any): jwk is JsonWebKey {
  return (
    typeof jwk === 'object' &&
    jwk.kty === 'EC' &&
    jwk.crv === 'P-256' &&
    typeof jwk.x === 'string' &&
    typeof jwk.y === 'string' &&
    (jwk.use === undefined || jwk.use === 'sig') &&
    (jwk.key_ops === undefined || Array.isArray(jwk.key_ops))
  );
}