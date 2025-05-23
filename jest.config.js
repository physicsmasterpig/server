module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/test/**/*.test.js'
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  // matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // A map from regular expressions to paths to transformers
  transform: {},
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // Collect coverage information from the specified directories
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ]
};
