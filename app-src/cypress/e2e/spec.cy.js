describe('UI Tests', () => {})

export function visitBaseUrlAndTest(fn) {
  cy.visit('#base="http%3A%2F%2Flocalhost%3A3001%2F"')

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
