import { CY_BASE_URL } from './constants'

/**
 * Setup console error instrumentation in the window
 * This should be called before any interactions that might trigger console errors
 */
export function setupConsoleInstrumentation() {
  cy.window().then((win) => {
    win.__consoleErrors = win.__consoleErrors || []
    win.__consoleWarns = win.__consoleWarns || []
    
    const origError = win.console.error?.bind(win.console)
    const origWarn = win.console.warn?.bind(win.console)

    win.console.error = function (...args) {
      win.__consoleErrors.push(args)
      if (origError) origError(...args)
    }
    win.console.warn = function (...args) {
      win.__consoleWarns.push(args)
      if (origWarn) origWarn(...args)
    }
  })
}

/**
 * Assert that no console errors or warnings were recorded
 * Call this after your test interactions
 */
export function assertNoConsoleErrors() {
  cy.window().then((win) => {
    const errors = win.__consoleErrors || []
    const warns = win.__consoleWarns || []
    
    // Filter out known benign React dev warnings
    const filteredErrors = errors.filter((e) => {
      try {
        const s = Array.isArray(e) ? e.join(' ') : String(e)
        if (s.toLowerCase().includes('invalid value for prop') && 
            s.toLowerCase().includes('src') && 
            s.toLowerCase().includes('img')) {
          return false
        }
      } catch (err) {}
      return true
    })
    
    expect(filteredErrors).to.have.length(0, `Console errors: ${JSON.stringify(filteredErrors.slice(0, 3))}`)
    expect(warns).to.have.length(0, `Console warnings: ${JSON.stringify(warns.slice(0, 3))}`)
  })
}

/**
 * Clear console error buffers
 */
export function clearConsoleErrors() {
  cy.window().then((win) => {
    win.__consoleErrors = []
    win.__consoleWarns = []
  })
}

/**
 * Helper function for visiting base URL and testing with console error checking
 * This is the recommended way to write tests
 * 
 * Usage:
 *   visitBaseUrlAndTest(() => {
 *     // Your test code here
 *     // Console errors are automatically checked at the end
 *   })
 */
export function visitBaseUrlAndTest(testFn) {
  cy.visit(CY_BASE_URL, { timeout: 10000 })
  
  // Wait for navbar to be visible (indicates React has hydrated)
  cy.get('nav', { timeout: 5000 }).should('be.visible')
  
  // Setup console instrumentation
  setupConsoleInstrumentation()
  
  // Run the specific test function
  testFn()
  
  // Check for console errors after test execution
  assertNoConsoleErrors()
}

export { CY_BASE_URL }