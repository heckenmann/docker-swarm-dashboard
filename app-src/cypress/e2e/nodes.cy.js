import { visitBaseUrlAndTest } from './spec.cy'

describe('Nodes Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'manager1').click()
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'manager2').click()
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'manager3').click()
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'worker1').click()
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'worker2').click()
    })
  })
})
