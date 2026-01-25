import { visitBaseUrlAndTest } from './spec.cy'

describe('Dashboard horizontal Tests', () => {
  it('Dashboard horizontal', () => {
    visitBaseUrlAndTest(() => {
  cy.contains('a', 'Dashboard').click()
  // wait for services table to render so subsequent queries find elements
  cy.get('#dashboardTable', { timeout: 5000 }).should('exist')
  // assert known mock-generated service header exists
  cy.contains('th .service-name-text', 'backend_auth-service', { timeout: 5000 }).should('exist')
      // check that manager node open buttons exist and toggle if present
      // manager buttons are rendered as small buttons with title "Open node: <name>"
      const managers = ['manager1', 'manager2', 'manager3']
      // just assert the small open buttons for manager nodes exist; clicking them
      // can cause re-renders which make subsequent assertions flaky
      cy.wrap(managers).each((m) => {
        cy.get(`button[title="Open node: ${m}"]`, { timeout: 2000 }).should('exist')
      })

  // open a service details by clicking the service's small open button next to the header
  // target the header that contains the known service name and click its open button
  cy.contains('th .service-name-text', 'backend_auth-service', { timeout: 5000 })
    .closest('th')
    .find('button.name-open-btn')
    .click()
  // dump the rendered DOM to help debugging why details may not appear
  cy.document().then((d) => {
    // previously dumped DOM to cypress/results for debugging; removed to avoid test artifacts
  })
  // wait for the details panel buttons to render then assert
  cy.contains('button', 'JSON', { timeout: 5000 }).should('be.visible')
  cy.contains('button', 'Table', { timeout: 5000 }).should('be.visible')
    })
  })

  it('Filter by service name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
  // filter for a known mock service prefix and assert visibility
  cy.get('input[placeholder="Filter services by service name"]').type('backend_')
  cy.contains('th .service-name-text', 'backend_auth-service').should('exist')
  cy.get('input[placeholder="Filter services by service name"]').clear()
  cy.get('input[placeholder="Filter services by service name"]').type('frontend_')
  cy.contains('th .service-name-text', 'frontend_user-service').should('exist')
  cy.get('input[placeholder="Filter services by service name"]').clear()
    })
  })

  it('Filter by stack name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
  // select Stack filter and type 'backend' to match mock-generated stack
  // select the Stack option by value to change filter mode
  cy.get('select.w-auto.form-select').select('stack')
  // type into the visible filter input (do not rely on placeholder text which
  // may not update instantly in all environments)
  cy.get('input.w-75.form-control', { timeout: 3000 }).type('backend')
  // after filtering by stack, assert a known backend service exists
  cy.contains('th .service-name-text', 'backend_auth-service').should('exist')
  cy.get('input.w-75.form-control').clear()
      cy.get('input.w-75.form-control').clear()
    })
  })
})
