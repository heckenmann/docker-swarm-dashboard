describe('Filter input keyboard focus', () => {
  it('keeps focus and the typed value while typing in the dashboard filter', () => {
    cy.get('a[aria-label="Dashboard"]').click()
    cy.get('#dashboardTable', { timeout: 10000 }).should('exist')

    cy.get('input[aria-label="Filter by service name"]').as('filter')
    cy.get('@filter').click().type('front')

    // The filter atom used to suspend on every keystroke, which unmounted the
    // whole view and moved focus back to the document body after one letter.
    cy.get('@filter').should('have.value', 'front')
    cy.focused().should('have.attr', 'aria-label', 'Filter by service name')
    cy.get('#dashboardTable').should('exist')
  })

  it('keeps focus while typing in the stacks filter', () => {
    cy.get('a[aria-label="Stacks"]').click()
    cy.get('input[aria-label="Filter by service name"]', { timeout: 10000 })
      .as('filter')
      .click()
      .type('front')

    cy.get('@filter').should('have.value', 'front')
    cy.focused().should('have.attr', 'aria-label', 'Filter by service name')
  })

  it('does not push a history entry per keystroke', () => {
    cy.get('a[aria-label="Dashboard"]').click()
    cy.get('#dashboardTable', { timeout: 10000 }).should('exist')

    cy.window().then((win) => {
      const before = win.history.length
      cy.get('input[aria-label="Filter by service name"]').click().type('front')
      cy.get('input[aria-label="Filter by service name"]').should(
        'have.value',
        'front',
      )
      cy.window().its('history.length').should('eq', before)
    })
  })
})
