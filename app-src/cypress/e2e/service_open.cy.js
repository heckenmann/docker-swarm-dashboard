import { visitBaseUrlAndTest } from './spec.cy'

describe('Service open details', () => {
  it('opens service details from header and shows JSON/Table buttons', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.get('#dashboardTable', { timeout: 5000 }).should('exist')
      // find a known service header and click its open button
      cy.contains('th .service-name-text', 'backend_auth-service', { timeout: 5000 })
        .closest('th')
        .find('button.name-open-btn')
        .click()

      // details panel should show JSON and Table buttons
      cy.contains('button', 'JSON', { timeout: 5000 }).should('be.visible')
      cy.contains('button', 'Table', { timeout: 5000 }).should('be.visible')
    })
  })
})
