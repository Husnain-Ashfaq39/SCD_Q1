module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'server.js',
    '!node_modules/',
    '!**/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 55,
      lines: 70,
      statements: 70
    }
  },
  setupFiles: ['./tests/setup.js']
}; 