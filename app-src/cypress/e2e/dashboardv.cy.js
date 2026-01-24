import { visitBaseUrlAndTest } from './spec.cy'

describe('Dashboard vertical Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      // switch to vertical layout using the small layout toggle (grip-vertical)
      // find the button that contains the grip-vertical SVG and click it
      cy.get('svg[data-icon="grip-vertical"]').closest('button').then(($b) => {
        if ($b.length) {
          cy.wrap($b).click()
        } else {
          // fallback to the second main button if the SVG selector fails
          cy.get('main').within(() => { cy.get('button').eq(1).click() })
        }
      })
  // click the cell that contains the known mock service using stable cell selector
  cy.contains('td', 'backend_auth-service').click()
  // assert that manager1 node row/header exists in the vertical layout
  cy.contains('th', 'manager1').should('exist')
    })
  })

  it('Filter by service name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.get('main').within(() => {
        cy.get('button').eq(1).should('be.visible').click()
      })
  // assert known mock services exist and that filtering works
  cy.contains('td', 'backend_auth-service').should('exist')
  cy.contains('td', 'frontend_user-service').should('exist')
  cy.get('input.w-75.form-control').type('backend_')
  cy.contains('td', 'backend_auth-service').should('exist')
  cy.get('input.w-75.form-control').clear()
    })
  })

  it('Filter by stack name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
  cy.get('main').within(() => { cy.get('button').eq(1).click() })
  cy.get('select.w-auto.form-select').select('stack')
  cy.get('input.w-75.form-control').type('frontend')
  cy.contains('td', 'frontend_user-service').should('exist')
    })
  })
})
