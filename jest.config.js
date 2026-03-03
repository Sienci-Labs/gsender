module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  automock: false,
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(three)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'App.test.tsx',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass|styl)$': '<rootDir>/src/app/src/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/app/src/__mocks__/fileMock.js',
    '^app/(.*)$': '<rootDir>/src/app/src/$1',
    '^(\\.{1,2}/)*config/settings$': '<rootDir>/src/app/src/config/__mocks__/settings.ts',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  haste: {
    forceNodeFilesystemAPI: true,
  },
};
