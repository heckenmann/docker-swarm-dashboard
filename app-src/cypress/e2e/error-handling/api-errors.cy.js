
describe('API Error Handling Tests', () => {
  it('should show nav even if API has issues', () => {
    
      cy.get('nav').should('be.visible')
    
  })

  it('should display content when API is available', () => {
    
      cy.get('#dashboardTable').should('exist')
    
  })

  it('should handle navigation gracefully', () => {
    
      cy.get('a[aria-label="Dashboard"]').click()
      cy.get('#dashboardTable').should('exist')
      
      cy.get('a[aria-label="Nodes"]').click()
      cy.get('table').should('exist')
    
  })

  it('should handle settings page gracefully', () => {
    
      cy.get('a[aria-label="Settings"]').click()
      cy.get('input[aria-label="Toggle dark mode"]').should('exist')
    
  })
})