import { visitBaseUrlAndTest } from './spec.cy'

describe('About Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="About"]').click()
      cy.contains('h1, h2, h3', 'Docker Swarm Dashboard').should('be.visible')
    })
  })
})
