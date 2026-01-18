import { visitBaseUrlAndTest } from './spec.cy'

describe('Nodes Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
  cy.contains('a', 'Nodes').click()
  // assert the expected nodes exist and open a couple of them
  cy.contains('td', 'manager1').should('be.visible').click()
  cy.contains('td', 'manager2').should('exist')
  cy.contains('td', 'worker1').should('exist')
    })
  })
})
