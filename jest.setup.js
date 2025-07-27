import '@testing-library/jest-dom';

import { webcrypto } from 'crypto';

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: jest.fn(() => ({
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(),
          get: jest.fn(),
          clear: jest.fn(),
        })),
      })),
      createObjectStore: jest.fn(),
    },
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  })),
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
