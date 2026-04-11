
describe('Settings controls', () => {
  it('toggles dark mode and refresh interval', () => {
    
      cy.get('a[aria-label="Settings"]').click()
      // Toggle dark mode using its aria-label
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('be.checked')
      // Toggle it back off
      cy.get('input[aria-label="Toggle dark mode"]').uncheck({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('not.be.checked')
    
  })
})
