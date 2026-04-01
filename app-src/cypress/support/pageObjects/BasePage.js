import { CY_BASE_URL } from '../constants'

/**
 * Base Page Object with common functionality
 */
class BasePage {
  visitBaseUrl() {
    cy.visit(CY_BASE_URL)
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    return this
  }
  
  getNavbar() {
    return cy.get('nav')
  }
  
  getNavbarLink(label) {
    return cy.get(`a[aria-label="${label}"]`)
  }
  
  navigateTo(pageLabel) {
    this.getNavbarLink(pageLabel).click()
    return this
  }
  
  assertNoConsoleErrors() {
    cy.window().then((win) => {
      const c = win.console || {}
      const errors = c.__errors || []
      // If the app hasn't instrumented console, fallback to assuming no errors
      expect(Array.isArray(errors) ? errors.length : 0).to.eq(
        0,
        `Console errors: ${JSON.stringify(errors)}`
      )
    })
    cy.document().its('body').should('not.contain', 'ERROR')
    return this
  }
  
  waitForAppLoad() {
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    return this
  }
}

export default BasePage