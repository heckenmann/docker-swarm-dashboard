import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Nodes interactions
 */
class NodesPage {
  visit() {
    cy.visit(CY_BASE_URL)
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Nodes"]').click()
    return this
  }
  
  getNodeCards() {
    return cy.get('[data-cy="node-card"]')
  }
  
  getNodeByName(nodeName) {
    return cy.contains('[data-cy="node-name"]', nodeName)
  }
  
  clickNodeDetails(nodeName) {
    this.getNodeByName(nodeName).click()
    return this
  }
  
  getMetricsSection() {
    return cy.get('[data-cy="node-metrics"]')
  }
  
  getTasksTab() {
    return cy.get('[data-cy="node-tasks-tab"]')
  }
  
  assertNodeExists(nodeName) {
    this.getNodeByName(nodeName).should('exist')
    return this
  }
  
  assertNodeCount(count) {
    this.getNodeCards().should('have.length', count)
    return this
  }
}

export default NodesPage