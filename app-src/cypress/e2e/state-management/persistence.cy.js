import { visitBaseUrlAndTest } from '../../support/common'

describe('State Persistence Tests', () => {
  it('should persist dark mode setting across sessions', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Settings"]').click()
      cy.wait(500)
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('be.checked')
      
      // Navigate away and back
      cy.get('a[aria-label="Dashboard"]').click()
      cy.get('a[aria-label="Settings"]').click()
      cy.wait(500)
      
      // Verify dark mode setting persists
      cy.get('input[aria-label="Toggle dark mode"]').should('be.checked')
    })
  })

  it('should persist navigation labels setting across sessions', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Settings"]').click()
      cy.wait(500)
      cy.get('input[aria-label="Toggle navigation labels"]').check({ force: true })
      
      // Navigate away and back
      cy.get('a[aria-label="Dashboard"]').click()
      cy.get('a[aria-label="Settings"]').click()
      cy.wait(500)
      
      // Verify navigation labels setting persists
      cy.get('input[aria-label="Toggle navigation labels"]').should('be.checked')
    })
  })

  it('should reset to defaults when requested', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Settings"]').click()
      cy.wait(500)
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      cy.get('button:contains("Large (lg)")').click()
      cy.get('input[aria-label="Toggle navigation labels"]').check({ force: true })
      
      // Reset to defaults
      cy.get('button[aria-label="Reset settings to defaults"]').click()
      cy.wait(300)
      
      // Verify settings are reset
      cy.get('input[aria-label="Toggle dark mode"]').should('not.be.checked')
      cy.get('button:contains("Small (sm)")').should('have.class', 'active')
      cy.get('input[aria-label="Toggle navigation labels"]').should('not.be.checked')
    })
  })
})