import { CY_BASE_URL } from '../constants'
import { assertNoConsoleErrors } from '../common'

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
    assertNoConsoleErrors()
    cy.document().its('body').should('not.contain', 'ERROR')
    return this
  }
  
  waitForAppLoad() {
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    return this
  }
}

export default BasePage
