'use client';

const DB_NAME = 'RodeoAuth';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const PRIVATE_KEY_ID = 'device-private-key';

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/**
 * Initialize IndexedDB for key storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Generate a new ECDSA P-256 key pair
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['sign', 'verify'],
  );

  return keyPair as KeyPair;
}

/**
 * Export public key as JWK
 */
export async function exportPublicKeyJWK(
  publicKey: CryptoKey,
): Promise<JsonWebKey> {
  return await crypto.subtle.exportKey('jwk', publicKey);
}

/**
 * Store private key in IndexedDB
 */
export async function storePrivateKey(privateKey: CryptoKey): Promise<void> {
  const db = await openDB();

  // Export private key as JWK for storage BEFORE starting the transaction
  const privateKeyJWK = await crypto.subtle.exportKey('jwk', privateKey);

  // Persist the JWK directly so we can derive the public key later without
  // attempting to re-export a non-extractable CryptoKey

  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put(privateKeyJWK, PRIVATE_KEY_ID);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Retrieve the stored private key JWK without importing it
 */
async function getStoredPrivateKeyJWK(): Promise<JsonWebKey | null> {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const jwk = await new Promise<JsonWebKey | undefined>((resolve, reject) => {
    const request = store.get(PRIVATE_KEY_ID);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

  return jwk ?? null;
}

/**
 * Retrieve private key from IndexedDB
 */
export async function getStoredPrivateKey(): Promise<CryptoKey | null> {
  try {
    const privateKeyJWK = await getStoredPrivateKeyJWK();
    if (!privateKeyJWK) {
      return null;
    }

    // Import private key from stored JWK
    return await crypto.subtle.importKey(
      'jwk',
      privateKeyJWK,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign'],
    );
  } catch (error) {
    console.error('Error retrieving private key:', error);
    return null;
  }
}

/**
 * Clear all stored keys (for device reset)
 */
export async function clearStoredKeys(): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Sign a message with the stored private key
 */
export async function signChallenge(nonce: string): Promise<string> {
  const privateKey = await getStoredPrivateKey();
  if (!privateKey) {
    throw new Error('No private key found');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(nonce);

  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    data,
  );

  // Convert signature to base64url
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Check if device has stored keys
 */
export async function hasStoredKeys(): Promise<boolean> {
  const privateKey = await getStoredPrivateKey();
  return privateKey !== null;
}

/**
 * Initialize device - generate keys if needed and register device
 */
export async function initializeDevice(): Promise<string> {
  let privateKey = await getStoredPrivateKey();
  let publicKeyJWK: JsonWebKey;

  if (!privateKey) {
    // Generate new key pair
    const keyPair = await generateKeyPair();
    privateKey = keyPair.privateKey;

    // Store private key
    await storePrivateKey(privateKey);

    // Export public key
    publicKeyJWK = await exportPublicKeyJWK(keyPair.publicKey);
  } else {
    // Derive public key from stored JWK without re-exporting the key
    const privateKeyJWK = await getStoredPrivateKeyJWK();
    if (!privateKeyJWK) {
      throw new Error('Stored private key JWK missing');
    }
    publicKeyJWK = {
      kty: privateKeyJWK.kty,
      crv: privateKeyJWK.crv,
      x: privateKeyJWK.x,
      y: privateKeyJWK.y,
      use: 'sig',
    };
  }

  // Register device
  const response = await fetch('/api/device/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicKeyJwk: publicKeyJWK }),
  });

  if (!response.ok) {
    throw new Error(`Device registration failed: ${response.statusText}`);
  }

  const { deviceId } = await response.json();
  return deviceId;
}
