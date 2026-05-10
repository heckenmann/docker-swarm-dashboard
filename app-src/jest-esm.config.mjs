export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  transformIgnorePatterns: ['node_modules/(?!(refractor)/)'],
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/tests/unit/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
    '^react-apexcharts$': '<rootDir>/__mocks__/react-apexcharts.js',
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}