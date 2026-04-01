import { visitBaseUrlAndTest } from '../../support/common'

describe('Settings Enhanced Tests', () => {
  it('should toggle dark mode setting', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Settings"]').click()
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('be.checked')
    })
  })

  it('should toggle dark mode off', () => {
    visitBaseUrlAndTest(() => {
      cy.get('a[aria-label="Settings"]').click()
      cy.get('input[aria-label="Toggle dark mode"]').uncheck({ force: true })
      cy.get('input[aria-label="Toggle dark mode"]').should('not.be.checked')
    })
  })
})