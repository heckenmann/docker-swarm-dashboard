import { visitBaseUrlAndTest } from './spec.cy'

describe('About Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'About').click()
      cy.document().its('body').should('contain', 'Docker Swarm Dashboard')
    })
  })
})
