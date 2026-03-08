import { visitBaseUrlAndTest } from './spec.cy'

describe('Stacks Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
  cy.get('a[aria-label="Stacks"]').click()
  cy.contains('td', 'docker-swarm-dashboard').should('be.visible')
  cy.contains('.card-header strong', 'dsd').should('be.visible')
    })
  })
})
