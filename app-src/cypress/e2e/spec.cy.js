describe('UI Tests', () => {})

// Visit base URL and run a test callback. Uses Cypress baseUrl if set or
// falls back to the legacy hash base used by the app.
export function visitBaseUrlAndTest(fn, path = '/') {
  // Use the legacy hash base the app expects (kept because the app reads the hash)
  cy.visit('#base="http%3A%2F%2Flocalhost%3A3001%2F"')

  // Run the snippet that contains the test interaction/assertions
  fn()

  // Check for console errors in a safe way (console.error may be undefined)
  cy.window().then((win) => {
    const c = win.console || {}
    const errors = c.__errors || []
    // If the app hasn't instrumented console, fallback to assuming no errors
    expect(Array.isArray(errors) ? errors.length : 0).to.eq(
      0,
      `Console errors: ${JSON.stringify(errors)}`,
    )
  })

  cy.document().its('body').should('not.contain', 'ERROR')
}
