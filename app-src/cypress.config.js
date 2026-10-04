const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome' || browser.name === 'edge') {
          launchOptions.args.push('--window-size=1920,1080')
          launchOptions.args.push('--disable-dev-shm-usage')
          return launchOptions
        }
        if (browser.name === 'electron') {
          launchOptions.preferences.width = 1920
          launchOptions.preferences.height = 1080
          return launchOptions
        }
      })
      on('after:run', (results) => {
        if (results && typeof results.totalTests === 'number') {
          const passed = results.totalPassed
          const percentage =
            results.totalTests > 0
              ? ((passed / results.totalTests) * 100).toFixed(2)
              : '0.00'
          console.log(`\n📊 Test Results Summary:`)
          console.log(`   Total: ${results.totalTests} tests`)
          console.log(`   Passed: ${passed} (${percentage}%)`)
          console.log(`   Failed: ${results.totalFailed}`)
          console.log(`   Duration: ${Math.floor(results.totalDuration/1000)}s\n`)
        }
      })
    },
    // Memory management
    manageBrowserMemory: true,
    numTestsKeptInMemory: 0,
    
    baseUrl: 'http://localhost:3000',
    specPattern: [
      'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      '!cypress/utils/**/*.cy.{js,jsx,ts,tsx}'
    ],
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    downloadsFolder: 'cypress/downloads',
    video: false,
    screenshotOnRunFailure: false,
    viewportWidth: 3840,
    viewportHeight: 2160,
    autoVisit: true,
    defaultCommandTimeout: 5000,
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
  
  trashAssetsBeforeRuns: true,
  
  // Reporter configuration
  reporter: 'spec',
  reporterOptions: {
    mocha: {
      quiet: false
    }
  }
})
