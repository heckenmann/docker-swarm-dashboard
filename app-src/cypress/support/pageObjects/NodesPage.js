import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Nodes interactions
 */
class NodesPage {
  visit() {
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Nodes"]').click()
    return this
  }
  
  getNodeRows() {
    return cy.get('table tbody tr')
  }
  
  getNodeRowByName(nodeName) {
    return cy.contains('td', nodeName)
  }
  
  clickNodeRow(nodeName) {
    this.getNodeRowByName(nodeName).click()
    return this
  }
  
  assertNodeExists(nodeName) {
    this.getNodeRowByName(nodeName).should('exist')
    return this
  }

  assertClusterMetricsVisible() {
    cy.contains('Cluster CPU').should('be.visible')
    cy.contains('Cluster Memory').should('be.visible')
    cy.contains('Cluster Disk').should('be.visible')
    return this
  }

  assertClusterCpuCores(cores) {
    cy.contains('.card', 'Cluster CPU')
      .contains(cores)
      .should('be.visible')
    return this
  }
}

export default NodesPage