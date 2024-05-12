import { visitBaseUrlAndTest } from './spec.cy'

describe('Tasks Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Tasks').click()
    })
  })
})
