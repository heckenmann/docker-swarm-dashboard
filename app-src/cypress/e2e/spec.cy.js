describe('UI Tests', () => {})

export function visitBaseUrlAndTest(fn) {
  const baseUrl =
    'http://localhost:3000#base="http%3A%2F%2Flocalhost%3A3001%2F"'
  cy.viewport(1920, 1080)
  cy.visit(baseUrl)

  fn()

  cy.window().then((win) => {
    // Prüfe auf Fehler in der Konsole
    const consoleErrors = win.console.error
    expect(consoleErrors.length).to.eq(
      0,
      `Error found in console: ${consoleErrors}`,
    )
  })

  cy.document().its('body').should('not.contain', 'ERROR')
}
