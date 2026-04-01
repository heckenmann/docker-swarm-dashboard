import BasePage from '../../support/pageObjects/BasePage'

describe('Mobile Responsiveness Tests', () => {
  const basePage = new BasePage()

  it('should adapt layout for mobile viewport', () => {
    cy.viewport(375, 667) // iPhone SE size
    basePage.visitBaseUrl()
    cy.get('button[aria-controls="responsive-navbar-nav"]').should('be.visible')
    cy.get('button[aria-controls="responsive-navbar-nav"]').click()
    cy.get('#responsive-navbar-left').should('have.class', 'show')
  })

  it('should handle orientation changes', () => {
    cy.viewport('iphone-6', 'portrait')
    basePage.visitBaseUrl()
    cy.get('button[aria-controls="responsive-navbar-nav"]').should('be.visible')
    cy.viewport('iphone-6', 'landscape')
    cy.get('a[aria-label="Dashboard"]').should('exist')
  })
})