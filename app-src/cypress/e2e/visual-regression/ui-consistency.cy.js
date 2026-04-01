import { visitBaseUrlAndTest } from '../../support/common'

describe('UI Consistency Tests', () => {
  it('should maintain UI layout consistency', () => {
    visitBaseUrlAndTest(() => {
      cy.get('nav').should('be.visible')
      cy.get('#dashboardTable').should('be.visible')
      cy.get('.service-name-text').first().should('be.visible')
    })
  })

  it('should maintain visual consistency with dark mode', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Settings"]').click()
      cy.wait(300)
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      
      cy.get('a[aria-label="Dashboard"]').click()
      cy.wait(300)
      
      cy.get('table').should('exist')
    })
  })

  it('should maintain component styling consistency', () => {
    visitBaseUrlAndTest(() => {
      cy.get('#dashboardTable').should('exist')
      cy.get('.service-name-text').should('be.visible')
    })
  })
})