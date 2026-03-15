import { visitBaseUrlAndTest } from './spec.cy'

describe('Settings Tests', () => {
  it('Load page and toggle settings', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Settings"]').click()

      // Set Interval Refresh to 5 seconds (first button in ButtonGroup)
      cy.contains('button', '5s').click()
      // Verify it's active by checking for the active class
      cy.contains('button', '5s').should('have.class', 'active')

      // Toggle Dark Mode on and verify the theme attribute is applied
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('be.checked')
      cy.get('[data-bs-theme="dark"]').should('exist')

      // Set table size to small (second button in ButtonGroup for table size)
      cy.contains('button', 'Large (lg)').click()
      // Verify it's active by checking for the active class
      cy.contains('button', 'Large (lg)').should('have.class', 'active')

      // Toggle Centered layout on and verify Bootstrap container classes
      cy.get('input[aria-label="Toggle centered content width"]').check({ force: true })
      cy.get('input[aria-label="Toggle centered content width"]').should('be.checked')
      cy.get('main .container').should('exist')
      cy.get('nav .container').should('exist')

      // Toggle Show navigation labels on (default: unchecked)
      cy.get('input[aria-label="Toggle navigation labels"]').check({ force: true })
      cy.get('input[aria-label="Toggle navigation labels"]').should('be.checked')

      // Toggle Show names buttons off (default: checked)
      cy.get('input[aria-label="Toggle show buttons in names"]').uncheck({ force: true })
      cy.get('input[aria-label="Toggle show buttons in names"]').should('not.be.checked')
    })
  })
})
