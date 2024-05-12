import { visitBaseUrlAndTest } from './spec.cy'

describe('Stacks Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Stacks').click()
      cy.contains('td', 'docker-swarm-dashboard')
      cy.contains('h5', 'dsd').click()
    })
  })
})
