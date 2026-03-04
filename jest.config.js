module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  automock: false,
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: `${__dirname}/babel.config.js` }],
  },
  transformIgnorePatterns: [
  '/node_modules/(?!(three|@react-pdf|@react-pdf/renderer)/)',
],
 testPathIgnorePatterns: [
  '/node_modules/',
],
  moduleNameMapper: {
  '\\.(css|less|scss|sass|styl)$': '<rootDir>/src/app/src/__mocks__/styleMock.js',
  '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/app/src/__mocks__/fileMock.js',
  '^app/(.*)$': '<rootDir>/src/app/src/$1',
  '^(\\.{1,2}/)*config/settings$': '<rootDir>/src/app/src/config/__mocks__/settings.ts',
  'react-syntax-highlighter': '<rootDir>/src/app/src/__mocks__/reactSyntaxHighlighterMock.js',
  '^react-markdown$': '<rootDir>/src/app/src/__mocks__/reactMarkdownMock.js',
  '^app-root/(.*)$': '<rootDir>/$1',
'^react-icons/(.*)$': '<rootDir>/src/app/src/__mocks__/reactIconsMock.js',
  '^@/(.*)$': '<rootDir>/src/app/src/$1' ,
  '^react$': '<rootDir>/src/app/node_modules/react',
'^react-dom$': '<rootDir>/src/app/node_modules/react-dom',
'^react-dom/(.*)$': '<rootDir>/src/app/node_modules/react-dom/$1',
'^react-redux$': '<rootDir>/src/app/node_modules/react-redux',
  '^@react-pdf/renderer$': '<rootDir>/src/app/src/__mocks__/reactPdfMock.js'
},
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  haste: {
    forceNodeFilesystemAPI: true,
  },
};
