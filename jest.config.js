/**
 * Jest configuration for TypeScript + React testing
 * -------------------------------------------------
 * This separate config file is added to properly handle:
 * 1. TypeScript files (.ts, .tsx) using ts-jest preset.
 * 2. React components that rely on the DOM (using jest-environment-jsdom).
 * 3. Module aliasing and static asset imports (CSS, images) via moduleNameMapper.
 * 4. Setting up testing-library extensions like jest-dom.
 *
 * By keeping a dedicated Jest config, we can maintain test-specific settings
 * without affecting other build or runtime configurations.
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom', //  use installed jsdom environment
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  verbose: true,
};