import { visitBaseUrlAndTest } from './spec.cy'

describe('Timeline Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Timeline').click()
    })
  })
})
