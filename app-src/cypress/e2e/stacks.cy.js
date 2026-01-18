import { visitBaseUrlAndTest } from './spec.cy'

describe('Stacks Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
  cy.contains('a', 'Stacks').click()
  cy.contains('td', 'docker-swarm-dashboard').should('be.visible')
  cy.contains('h5', 'dsd').should('be.visible').click()
    })
  })
})
