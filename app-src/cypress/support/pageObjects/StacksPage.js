import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Stacks interactions
 */
class StacksPage {
  visit() {
    cy.visit(CY_BASE_URL)
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Stacks"]').click()
    return this
  }
  
  getStackCards() {
    return cy.get('[data-cy="stack-card"]')
  }
  
  getStackByName(stackName) {
    return cy.contains('[data-cy="stack-name"]', stackName)
  }
  
  clickStackDetails(stackName) {
    this.getStackByName(stackName).click()
    return this
  }
  
  getServiceList() {
    return cy.get('[data-cy="service-list"]')
  }
  
  getFilterInput() {
    return cy.get('input[aria-label="Filter by stack name"]')
  }
  
  filterByStackName(name) {
    this.getFilterInput().clear().type(name)
    return this
  }
  
  assertStackExists(stackName) {
    this.getStackByName(stackName).should('exist')
    return this
  }
  
  assertStackCount(count) {
    this.getStackCards().should('have.length', count)
    return this
  }
}

export default StacksPage