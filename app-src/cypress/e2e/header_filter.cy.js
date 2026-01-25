import { visitBaseUrlAndTest } from './spec.cy'

describe('Header filter buttons', () => {
  it('clicking header filter sets service filter input', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.get('#dashboardTable', { timeout: 5000 }).should('exist')

      // click the filter button on a service header
      cy.contains('th .service-name-text', 'frontend_user-service', { timeout: 5000 })
        .closest('th')
        .find('button.name-filter-btn')
        .click()

      // filter input should contain the service name
      cy.get('input[placeholder="Filter services by service name"]').should('have.value', 'frontend_user-service')
    })
  })
})
