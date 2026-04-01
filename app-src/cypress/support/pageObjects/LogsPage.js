import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Logs interactions
 */
class LogsPage {
  visit() {
    cy.visit(CY_BASE_URL)
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Logs"]').click()
    return this
  }
  
  getServiceSelector() {
    return cy.get('[data-cy="service-selector"]')
  }
  
  selectService(serviceName) {
    this.getServiceSelector().select(serviceName)
    return this
  }
  
  getTailLinesInput() {
    return cy.get('input[aria-label="Tail lines"]')
  }
  
  setTailLines(lines) {
    this.getTailLinesInput().clear().type(lines)
    return this
  }
  
  getFollowToggle() {
    return cy.get('input[aria-label="Follow logs"]')
  }
  
  toggleFollow() {
    this.getFollowToggle().check({ force: true })
    return this
  }
  
  getTimestampsToggle() {
    return cy.get('input[aria-label="Show timestamps"]')
  }
  
  toggleTimestamps() {
    this.getTimestampsToggle().check({ force: true })
    return this
  }
  
  getLogsOutput() {
    return cy.get('[data-cy="logs-output"]')
  }
  
  getSearchInput() {
    return cy.get('input[aria-label="Search logs"]')
  }
  
  searchLogs(query) {
    this.getSearchInput().clear().type(query)
    return this
  }
  
  assertLogContains(text) {
    this.getLogsOutput().should('contain.text', text)
    return this
  }
}

export default LogsPage