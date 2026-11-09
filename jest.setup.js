const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
require('@testing-library/jest-dom');

// Translations render in English in tests, so existing text assertions hold.
require('./src/app/src/i18n').initI18n('en');
