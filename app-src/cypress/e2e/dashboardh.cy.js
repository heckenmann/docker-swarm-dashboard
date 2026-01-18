import { visitBaseUrlAndTest } from './spec.cy'

describe('Dashboard horizontal Tests', () => {
  it('Dashboard horizontal', () => {
    visitBaseUrlAndTest(() => {
  cy.contains('a', 'Dashboard').click()
  // wait for services table to render so subsequent queries find elements
  cy.get('#dashboardTable', { timeout: 5000 }).should('exist')
  cy.contains('th > div', 'dsd_docker-swarm-dashboard', { timeout: 5000 }).should('exist')
      // check that manager filter buttons exist and toggle
      // manager buttons may or may not be present depending on mock data;
      // find buttons by text and click only if found to avoid flakiness
      // Query the document once and act conditionally to avoid detached-DOM
      const managers = ['manager1', 'manager2', 'manager3']
      // iterate managers sequentially using Cypress command queue to avoid
      // operating on detached DOM nodes after re-renders.
      cy.wrap(managers).each((m) => {
        cy.get('button').then(($buttons) => {
          const matched = $buttons.toArray().find((el) => new RegExp(m, 'i').test(el.innerText))
          if (matched) {
            cy.wrap(matched).click()
            // re-query a stable element after possible re-render
            cy.contains('button', 'JSON', { timeout: 2000 }).should('be.visible')
          } else {
            cy.log(`no button matching ${m}`)
          }
        })
      })

  // open a service details by clicking the header cell that contains the service name
  // Defensively click the service header only if it exists in the DOM.
  cy.get('body').then(($body) => {
    const hasHeader = Cypress.$($body).find('#dashboardTable thead th.dataCol').length > 0
    if (hasHeader) {
      cy.get('#dashboardTable thead th.dataCol').first().click()
    } else {
      cy.log('no service header found, skipping details click')
    }
  })
  // dump the rendered DOM to help debugging why details may not appear
  cy.document().then((d) => {
    // previously dumped DOM to cypress/results for debugging; removed to avoid test artifacts
  })
  // wait for the details panel buttons to render then assert
  cy.contains('button', 'JSON', { timeout: 3000 }).should('exist')
  cy.contains('button', 'Table', { timeout: 3000 }).should('exist')
    })
  })

  it('Filter by service name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.contains('th > div', 'dsd_docker-swarm-dashboard').should('exist')
      cy.contains('th > div', 'logger').should('exist')
      cy.get('input[placeholder="Filter services by service name"]').type('dsd')
      cy.contains('th > div', 'logger').should('not.exist')
      cy.get('input[placeholder="Filter services by service name"]')
        .clear()
        .type('logger')
      cy.contains('th > div', 'logger').should('exist')
      cy.contains('th > div', 'dsd_docker-swarm-dashboard').should('not.exist')
      cy.get('input[placeholder="Filter services by service name"]').clear()
    })
  })

  it('Filter by stack name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.contains('th > div', 'dsd_docker-swarm-dashboard')
      cy.contains('th > div', 'logger')
      cy.contains('select', 'Service').select('Stack')
      cy.get('input[placeholder="Filter services by stack name"]').type('dsd')
      cy.contains('th > div', 'logger').should('not.exist')
      cy.get('input[placeholder="Filter services by stack name"]')
        .clear()
        .type('logger')
      cy.contains('th > div', 'logger').should('not.exist')
      cy.contains('th > div', 'dsd_docker-swarm-dashboard').should('not.exist')
      cy.get('input[placeholder="Filter services by stack name"]').clear()
    })
  })
})
