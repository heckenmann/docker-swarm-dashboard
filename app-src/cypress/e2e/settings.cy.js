import { visitBaseUrlAndTest } from './spec.cy'

describe('Settings Tests', () => {
  it('Load page and toggle settings', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Settings"]').click()

      // Toggle Interval Refresh on
      cy.get('input[aria-label="Toggle auto refresh"]').check({ force: true })
      cy.get('input[aria-label="Toggle auto refresh"]').should('be.checked')

      // Toggle Dark Mode on and verify the theme attribute is applied
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('be.checked')
      cy.get('[data-bs-theme="dark"]').should('exist')

      // Toggle Small tables on
      cy.get('input[aria-label="Toggle compact tables"]').check({ force: true })
      cy.get('input[aria-label="Toggle compact tables"]').should('be.checked')

      // Toggle Centered layout on and verify Bootstrap container classes
      cy.get('input[aria-label="Toggle centered content width"]').should('not.be.checked')
      cy.get('input[aria-label="Toggle centered content width"]').check({ force: true })
      cy.get('input[aria-label="Toggle centered content width"]').should('be.checked')
      cy.get('main .container').should('exist')
      cy.get('nav .container').should('exist')

      // Toggle Show navigation labels on (default: unchecked)
      cy.get('input[aria-label="Toggle navigation labels"]').should('not.be.checked')
      cy.get('input[aria-label="Toggle navigation labels"]').check({ force: true })
      cy.get('input[aria-label="Toggle navigation labels"]').should('be.checked')
    })
  })
})
