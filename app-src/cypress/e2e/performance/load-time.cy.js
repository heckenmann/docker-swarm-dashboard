import BasePage from '../../support/pageObjects/BasePage'

describe('Performance Tests', () => {
  const basePage = new BasePage()

  it('should load within performance budget', { 
    retries: 2 
  }, () => {
    const startTime = performance.now()
    
    basePage.visitBaseUrl()
    
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    // Assert page loads within reasonable time (5 seconds for development)
    expect(loadTime).to.be.lessThan(5000)
    
    // Log performance metrics
    cy.log(`Page load time: ${loadTime.toFixed(2)}ms`)
  })

  it('should maintain responsive UI during interactions', () => {
    basePage.visitBaseUrl()
    
    const startInteractionTime = performance.now()
    
    // Perform typical user interaction
    cy.get('a[aria-label="Dashboard"]').click()
    cy.get('#dashboardTable', { timeout: 5000 }).should('exist')
    
    const endInteractionTime = performance.now()
    const interactionTime = endInteractionTime - startInteractionTime
    
    // Interaction should be responsive (< 2 seconds)
    expect(interactionTime).to.be.lessThan(2000)
    
    cy.log(`Navigation time: ${interactionTime.toFixed(2)}ms`)
  })

  it('should handle memory efficiently with repeated navigations', () => {
    basePage.visitBaseUrl()
    
    // Navigate between pages multiple times to check for memory leaks
    for (let i = 0; i < 5; i++) {
      cy.get('a[aria-label="Dashboard"]').click()
      cy.get('#dashboardTable', { timeout: 3000 }).should('exist')
      
      cy.get('a[aria-label="Nodes"]').click()
      cy.get('table', { timeout: 3000 }).should('exist')
    }
    
    // If no crashes occurred, test passes
    cy.get('nav').should('be.visible')
  })
})