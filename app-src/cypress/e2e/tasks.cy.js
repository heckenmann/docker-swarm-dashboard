import { visitBaseUrlAndTest } from './spec.cy'

describe('Tasks Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Tasks"]').click()
    })
  })
})
