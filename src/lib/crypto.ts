// Utilities compatible with both Node.js and Edge runtimes
// Provide helpers that rely solely on the Web Crypto API so they work
// when the file is executed in the Edge Runtime.

/**
 * Generate cryptographically secure random bytes.
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Create a SHA-256 hash of the input string and return it as a hex string.
 */
export async function createHash(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a JWK thumbprint according to RFC 7638
 * For ECDSA P-256 keys, we use the canonical JWK representation
 */
export async function generateJWKThumbprint(jwk: JsonWebKey): Promise<string> {
  // For ECDSA P-256, canonical representation includes: crv, kty, x, y
  const canonical = {
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  };

  const canonicalString = JSON.stringify(canonical);
  const data = new TextEncoder().encode(canonicalString);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64Url(hash);
}

/**
 * Generate a secure random nonce for challenges
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToBase64Url(bytes.buffer);
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
    ['verify'],
  );
}

/**
 * Verify an ECDSA P-256 signature using the stored public key
 */
export async function verifySignature(
  publicKeyJwk: JsonWebKey,
  nonce: string,
  signature: string,
): Promise<boolean> {
  try {
    const publicKey = await importPublicKey(publicKeyJwk);

    // Convert base64url signature to ArrayBuffer
    const signatureBuffer = base64UrlToUint8Array(signature);

    // Convert nonce to ArrayBuffer for verification
    const nonceBuffer = new TextEncoder().encode(nonce);

    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      publicKey,
      signatureBuffer,
      nonceBuffer,
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Create a session cookie value with HMAC signature
 */
export async function signSessionCookie(
  sessionId: string,
  secret: string,
): Promise<string> {
  const data = new TextEncoder().encode(`${sessionId}.${secret}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const signature = bufferToBase64Url(hash);
  return `${sessionId}.${signature}`;
}

/**
 * Verify and extract session ID from signed cookie
 */
export async function verifySessionCookie(
  signedCookie: string,
  secret: string,
): Promise<string | null> {
  try {
    const [sessionId, signature] = signedCookie.split('.');
    if (!sessionId || !signature) return null;

    const expectedCookie = await signSessionCookie(sessionId, secret);
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
export function validateECDSAP256JWK(jwk: unknown): jwk is JsonWebKey {
  if (!jwk || typeof jwk !== 'object') return false;
  const obj = jwk as Record<string, unknown>;
  return (
    obj.kty === 'EC' &&
    obj.crv === 'P-256' &&
    typeof obj.x === 'string' &&
    typeof obj.y === 'string' &&
    (obj.use === undefined || obj.use === 'sig') &&
    (obj.key_ops === undefined || Array.isArray(obj.key_ops))
  );
}
