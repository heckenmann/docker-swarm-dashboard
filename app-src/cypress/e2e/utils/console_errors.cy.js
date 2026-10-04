describe('Console stays clean when navigating with hidden labels', () => {
  const navLabels = [
    'Dashboard',
    'Timeline',
    'Stacks',
    'Nodes',
    'Tasks',
    'Ports',
    'Logs',
    'About',
    'Settings',
  ]

  navLabels.forEach((label) => {
    it(`navigates to ${label} without console diagnostics`, () => {
      cy.get(`nav a[aria-label="${label}"]`).click()
      cy.get('[data-testid="loading-bar"]', { timeout: 5000 }).should(
        'not.exist',
      )
      // The global afterEach hook asserts the captured console diagnostics.
    })
  })
})
