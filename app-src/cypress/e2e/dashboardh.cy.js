import { visitBaseUrlAndTest } from './spec.cy'

describe('Dashboard horizontal Tests', () => {
  it('Dashboard horizontal', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.contains('button', 'manager1').click()
      cy.contains('button', 'JSON')

      cy.contains('a', 'Dashboard').click()
      cy.contains('button', 'manager2').click()
      cy.contains('button', 'JSON')

      cy.contains('a', 'Dashboard').click()
      cy.contains('button', 'manager3').click()
      cy.contains('button', 'JSON')

      cy.contains('a', 'Dashboard').click()
      cy.contains('div', 'dsd_docker-swarm-dashboard').click()
      cy.contains('button', 'JSON')
      cy.contains('button', 'Table')
    })
  })

  it('Filter by service name', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.contains('th > div', 'dsd_docker-swarm-dashboard')
      cy.contains('th > div', 'logger')
      cy.get('input[placeholder="Filter services by service name"]').type('dsd')
      cy.contains('th > div', 'logger').should('not.exist')
      cy.get('input[placeholder="Filter services by service name"]')
        .clear()
        .type('logger')
      cy.contains('th > div', 'logger')
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
