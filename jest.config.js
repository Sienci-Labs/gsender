module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    automock: false,
    transform: {
        "^.+\\.[jt]sx?$": ["babel-jest", { configFile: "./babel.config.js" }],
    },
    transformIgnorePatterns: [
        "/node_modules/(?!(three|refractor|hastscript|hast-util-to-html|property-information)/)",
    ],
    testPathIgnorePatterns: ["/node_modules/", "App.test.tsx"],
    moduleNameMapper: {
        "\\.(css|less|scss|sass|styl)$": "<rootDir>/__mocks__/styleMock.js",
        "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
        "^app/(.*)$": "<rootDir>/src/app/src/$1",
        "^(\\.{1,2}/)*config/settings$": "<rootDir>/src/app/src/config/__mocks__/settings.ts",
        "^react-syntax-highlighter$": "<rootDir>/src/app/src/mocks/reactSyntaxHighlighterMock.js",
        "^react-syntax-highlighter/(.*)$": "<rootDir>/src/app/src/mocks/reactSyntaxHighlighterMock.js",
        "^refractor(.*)$": "<rootDir>/src/app/src/mocks/reactSyntaxHighlighterMock.js",
    },
    testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/*.test.[jt]s?(x)"],
    haste: {
        forceNodeFilesystemAPI: true,
    },
};