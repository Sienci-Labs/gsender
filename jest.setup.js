require("@testing-library/jest-dom");

const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

Object.defineProperty(globalThis, "import", {
    value: { meta: { env: {} } },
    writable: true,
});

// Suppress known React warnings
beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation((msg) => {
        if (typeof msg === 'string' && msg.includes('Unknown event handler property')) return;
        console.error(msg);
    });
});