const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('after:run', (results) => {
        if (results) {
          const passed = results.totalTests - results.totalFailures
          const percentage = ((passed / results.totalTests) * 100).toFixed(2)
          console.log(`\n📊 Test Results Summary:`)
          console.log(`   Total: ${results.totalTests} tests`)
          console.log(`   Passed: ${passed} (${percentage}%)`)
          console.log(`   Failed: ${results.totalFailures}`)
          console.log(`   Duration: ${Math.floor(results.totalDuration/1000)}s\n`)
        }
      })
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    downloadsFolder: 'cypress/downloads',
    video: false,
    screenshotOnRunFailure: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 5000,
    execTimeout: 30000,
    taskTimeout: 30000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 15000,
    retries: {
      runMode: 1,
      openMode: 0
    },
    // Parallelization settings
    experimentalWebKitSupport: false,
    experimentalRunAllSpecs: true,
    allowCypressEnv: false,
    env: {
      mockApiUrl: 'http://localhost:3001',
      testUser: {
        username: 'testuser',
        password: 'testpass'
      }
    }
  },
  
  component: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },
  
  // Optimize for speed
  numTestsKeptInMemory: 0,
  trashAssetsBeforeRuns: false,
  
  // Reporter configuration
  reporter: 'spec',
  reporterOptions: {
    mocha: {
      quiet: false
    }
  }
})
