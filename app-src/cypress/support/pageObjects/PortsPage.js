/**
 * Page Object Model for Ports interactions
 */
class PortsPage {
  visit() {
    cy.visit('/#base="http%3A%2F%2Flocalhost%3A3001%2F"')
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Ports"]').click()
    return this
  }
  
  getPortsTable() {
    return cy.get('[data-cy="ports-table"]')
  }
  
  getPortRows() {
    return cy.get('[data-cy="port-row"]')
  }
  
  getProtocolFilter() {
    return cy.get('[data-cy="protocol-filter"]')
  }
  
  filterByProtocol(protocol) {
    this.getProtocolFilter().select(protocol)
    return this
  }
  
  getSearchInput() {
    return cy.get('input[aria-label="Search ports"]')
  }
  
  searchPorts(query) {
    this.getSearchInput().clear().type(query)
    return this
  }
  
  assertPortExists(portNumber) {
    cy.contains('[data-cy="port-number"]', portNumber).should('exist')
    return this
  }
  
  assertPortCount(count) {
    this.getPortRows().should('have.length', count)
    return this
  }
}

export default PortsPage