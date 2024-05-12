import { visitBaseUrlAndTest } from './spec.cy'

describe('Dashboard vertical Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.get('main button:eq(1)').click()
      cy.contains('td', 'dsd_docker-swarm-dashboard').click()
      cy.contains('a', 'Dashboard').click()
      cy.get('main button:eq(1)').click()
      cy.contains('th', 'manager1').click()
    })
  })

  it('Filter by service name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.get('main button:eq(1)').click()
      cy.contains('td', 'dsd_docker-swarm-dashboard')
      cy.contains('td', 'logger')
      cy.get('input[placeholder="Filter services by service name"]').type('dsd')
      cy.contains('th > div', 'logger').should('not.exist')
      cy.get('input[placeholder="Filter services by service name"]')
        .clear()
        .type('logger')
      cy.contains('td', 'logger')
      cy.contains('td', 'dsd_docker-swarm-dashboard').should('not.exist')
      cy.get('input[placeholder="Filter services by service name"]').clear()
    })
  })

  it('Filter by stack name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.get('main button:eq(1)').click()
      cy.contains('td', 'dsd_docker-swarm-dashboard')
      cy.contains('td', 'logger')
      cy.contains('select', 'Service').select('Stack')
      cy.get('input[placeholder="Filter services by stack name"]').type('dsd')
      cy.contains('td', 'logger').should('not.exist')
      cy.get('input[placeholder="Filter services by stack name"]')
        .clear()
        .type('logger')
      cy.contains('td', 'logger').should('not.exist')
      cy.contains('td', 'dsd_docker-swarm-dashboard').should('not.exist')
    })
  })
})
