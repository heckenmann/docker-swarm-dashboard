
describe('Settings Enhanced Tests', () => {
  it('should toggle dark mode setting', () => {
    
      cy.get('a[aria-label="Settings"]').click()
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('be.checked')
    
  })

  it('should toggle dark mode off', () => {
    
      cy.get('a[aria-label="Settings"]').click()
      cy.get('input[aria-label="Toggle dark mode"]').uncheck({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('not.be.checked')
    
  })
})