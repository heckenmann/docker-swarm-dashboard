
describe('UI Consistency Tests', () => {
  it('should maintain UI layout consistency', () => {
    
      cy.get('nav').should('be.visible')
      cy.get('#dashboardTable').should('be.visible')
      cy.get('.service-name-text').first().should('be.visible')
    
  })

  it('should maintain visual consistency with dark mode', () => {
    
      cy.get('a[aria-label="Settings"]').click()
      cy.get('input[aria-label="Toggle dark mode"]').should('be.visible').check({ force: true })
      
      cy.get('a[aria-label="Dashboard"]').click()
      cy.get('#dashboardTable').should('be.visible')
      
      cy.get('table').should('exist')
    
  })

  it('should maintain component styling consistency', () => {
    
      cy.get('#dashboardTable').should('exist')
      cy.get('.service-name-text').should('be.visible')
    
  })
})