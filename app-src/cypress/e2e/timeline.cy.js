import { visitBaseUrlAndTest } from './spec.cy'

describe('Timeline Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Timeline"]').click()
    })
  })
})
