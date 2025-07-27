import '@testing-library/jest-dom';

import { webcrypto } from 'crypto';

// Mock IndexedDB for testing
let storeData;
const mockIndexedDB = {
  open: jest.fn(() => {
    const objectStore = {
      put: jest.fn((value) => {
        storeData = value;
        const req = { onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      }),
      get: jest.fn(() => {
        const req = { onsuccess: null, onerror: null, result: storeData };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      }),
      clear: jest.fn(() => {
        storeData = undefined;
        const req = { onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      }),
    };

    const transaction = {
      objectStore: jest.fn(() => objectStore),
    };

    const request = {
      result: {
        transaction: jest.fn(() => transaction),
        createObjectStore: jest.fn(),
        objectStoreNames: { contains: jest.fn(() => false) },
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    // Trigger callbacks asynchronously to mimic real IndexedDB behavior
    setTimeout(() => {
      if (request.onupgradeneeded) request.onupgradeneeded({ target: request });
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);

    return request;
  }),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Provide Web Crypto API mocks for testing
const mockSubtle = {
  generateKey: jest.fn(),
  exportKey: jest.fn(),
  importKey: jest.fn(),
  sign: jest.fn(),
  verify: jest.fn(),
  digest: (...args) => webcrypto.subtle.digest(...args),
};

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: mockSubtle,
    getRandomValues: jest.fn((arr) => {
      return webcrypto.getRandomValues(arr);
    }),
  },
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array([...str].map((char) => char.charCodeAt(0)));
  }
};

global.TextDecoder = class TextDecoder {
  decode(arr) {
    return String.fromCharCode(...arr);
  }
};
