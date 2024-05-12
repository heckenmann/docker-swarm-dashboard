import { visitBaseUrlAndTest } from './spec.cy'

describe('Ports Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Ports').click()
      cy.contains('td', '8080')
      cy.contains('td', 'dsd_docker-swarm-dashboard')
    })
  })
})
