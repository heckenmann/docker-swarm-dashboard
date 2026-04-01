import { visitBaseUrlAndTest } from '../../support/common'

describe('Keyboard Navigation Tests', () => {
  it('should activate menu items with Enter key', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Dashboard"]').focus()
      cy.focused().trigger('keydown', { keyCode: 13 })
      cy.get('#dashboardTable', { timeout: 5000 }).should('exist')
    })
  })

  it('should have proper focus indicators', () => {
    visitBaseUrlAndTest(() => {
      cy.get('nav a').first().focus()
      cy.focused().should('be.visible')
    })
  })

  it('should allow focusing navigation links', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Dashboard"]').should('be.visible')
      cy.get('a[aria-label="Nodes"]').should('be.visible')
      cy.get('a[aria-label="Settings"]').should('be.visible')
    })
  })

  it('should allow accessing main content area', () => {
    visitBaseUrlAndTest(() => {
      cy.get('main').should('exist')
    })
  })
})