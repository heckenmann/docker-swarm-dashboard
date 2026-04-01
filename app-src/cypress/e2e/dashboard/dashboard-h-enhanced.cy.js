import { visitBaseUrlAndTest } from '../../support/common'

describe('Dashboard Horizontal Enhanced Tests', () => {
  it('should display dashboard with all components', () => {
    visitBaseUrlAndTest(() => {
      cy.get('#dashboardTable').should('exist')
      cy.get('.service-name-text').should('exist')
    })
  })

  it('should open service details', () => {
    visitBaseUrlAndTest(() => {
      cy.get('#dashboardTable').should('exist')
      cy.get('.service-name-text').first().click()
      cy.wait(300)
      cy.get('button').should('exist')
    })
  })
})