module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  // transformIgnorePatterns normally prevents transforming node_modules.
  // Include known ESM modules that need transpilation for Jest.
  transformIgnorePatterns: ['node_modules/(?!(refractor|react-syntax-highlighter)/)'],
  // only search for tests under tests/unit per project policy
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/tests/unit/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
    '^react-syntax-highlighter$': '<rootDir>/__mocks__/react-syntax-highlighter.js',
    '^react-syntax-highlighter/dist/esm/(.*)$': '<rootDir>/__mocks__/react-syntax-highlighter.js'
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.js']
}

// Enforce a minimum global coverage threshold to ensure project-wide test quality.
module.exports.coverageThreshold = {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}


