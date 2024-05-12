import { visitBaseUrlAndTest } from './spec.cy'

describe('Settings Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Settings').click()
      cy.get('input:eq(1)').click()
      cy.get('input:eq(2)').click()
    })
  })
})
