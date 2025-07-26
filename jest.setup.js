import '@testing-library/jest-dom';

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

// Mock crypto.subtle for testing
const mockSubtle = {
  generateKey: jest.fn(),
  exportKey: jest.fn(),
  importKey: jest.fn(),
  sign: jest.fn(),
  verify: jest.fn(),
};

Object.defineProperty(window, 'crypto', {
  value: {
    subtle: mockSubtle,
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
  writable: true,
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array([...str].map(char => char.charCodeAt(0)));
  }
};

global.TextDecoder = class TextDecoder {
  decode(arr) {
    return String.fromCharCode(...arr);
  }
};