require('@testing-library/jest-dom');

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

Object.defineProperty(globalThis, 'import', {
  value: { meta: { env: {} } },
  writable: true,
});
