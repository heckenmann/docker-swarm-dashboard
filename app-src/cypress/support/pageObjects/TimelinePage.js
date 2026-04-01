import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Timeline interactions
 */
class TimelinePage {
  visit() {
    cy.visit(CY_BASE_URL)
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Timeline"]').click()
    return this
  }
  
  getTimelineChart() {
    return cy.get('[data-cy="timeline-chart"]')
  }
  
  getServiceFilterInput() {
    return cy.get('input[aria-label="Filter by service name"]')
  }
  
  getStackFilterButton() {
    return cy.get('button[aria-label="Filter by stack"]')
  }
  
  getStackFilterInput() {
    return cy.get('input[aria-label="Filter by stack name"]')
  }
  
  filterByServiceName(name) {
    this.getServiceFilterInput().clear().type(name)
    return this
  }
  
  filterByStackName(name) {
    this.getStackFilterButton().click()
    this.getStackFilterInput().clear().type(name)
    return this
  }
  
  assertTimelineExists() {
    this.getTimelineChart().should('exist')
    return this
  }
  
  assertServiceInTimeline(serviceName) {
    cy.contains('[data-cy="timeline-service"]', serviceName).should('exist')
    return this
  }
}

export default TimelinePage