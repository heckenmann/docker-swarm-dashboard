import { visitBaseUrlAndTest } from './spec.cy'

describe('Nodes Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Nodes"]').click()
      cy.contains('td', 'manager1').should('be.visible').then(($el) => {
        $el.click()
      })
      cy.contains('td', 'manager2').should('exist')
      cy.contains('td', 'worker1').should('exist')
    })
  })
})
