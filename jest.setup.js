import '@testing-library/jest-dom';

import { webcrypto } from 'crypto';

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: jest.fn(() => {
    const request = {
      result: {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            put: jest.fn(() => ({ onsuccess: null, onerror: null })),
            get: jest.fn(() => ({
              onsuccess: null,
              onerror: null,
              result: undefined,
            })),
            clear: jest.fn(() => ({ onsuccess: null, onerror: null })),
          })),
        })),
        createObjectStore: jest.fn(),
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
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
