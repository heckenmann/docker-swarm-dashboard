import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Dashboard interactions
 */
class DashboardPage {
  visitHorizontal() {
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Dashboard"]').click()
    cy.get('#dashboardTable', { timeout: 5000 }).should('exist')
    return this
  }
  
  visitVertical() {
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    // First visit horizontal then switch to vertical
    cy.get('a[aria-label="Dashboard"]').click()
    cy.get('#dashboardTable', { timeout: 5000 }).should('exist')
    cy.get('main').within(() => { cy.get('button').eq(1).click() })
    return this
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
  
  getServiceHeader(serviceName) {
    return cy.contains('th .service-name-text', serviceName, { timeout: 5000 })
  }
  
  clickServiceOpenButton(serviceName) {
    this.getServiceHeader(serviceName)
      .closest('th')
      .find('button.name-open-btn')
      .click()
    return this
  }
  
  assertServiceExists(serviceName) {
    this.getServiceHeader(serviceName).should('exist')
    return this
  }
  
  filterByServiceName(prefix) {
    this.getServiceFilterInput().clear().type(prefix)
    return this
  }
  
  filterByStackName(stackName) {
    this.getStackFilterButton().click()
    this.getStackFilterInput().clear().type(stackName)
    return this
  }
  
  getManagerNodeButtons() {
    return cy.get('button[title^="Open node: "]')
  }
  
  assertManagerNodesExist(managers) {
    cy.wrap(managers).each((m) => {
      cy.get(`button[title="Open node: ${m}"]`, { timeout: 2000 }).should('exist')
    })
    return this
  }

  // Layout-specific methods for layout_specs tests
  getTable() {
    return cy.get('#dashboardTable')
  }

  getTableHeaderRows() {
    return cy.get('#dashboardTable thead tr')
  }

  getNodeAttributeHeaders() {
    return cy.get('#dashboardTable thead th.node-attribute')
  }

  getTableBodyRows() {
    return cy.get('#dashboardTable tbody tr')
  }

  getServiceColumnByIndex(index = 0) {
    return cy.get(`[data-cy="service-column-${index}"]`)
  }

  getFillerColumn() {
    return cy.get('[data-cy="filler-column"]')
  }

  getVerticalDashboardTable() {
    return cy.get('.vertical-dashboard')
  }

  getVerticalDashboardHeaderRows() {
    return cy.get('.vertical-dashboard thead tr')
  }

  getVerticalDashboardBodyRows() {
    return cy.get('.vertical-dashboard tbody tr')
  }

  switchToHorizontal() {
    cy.get('svg[data-icon="grip"]').closest('button').click()
    return this
  }

  switchToVertical() {
    cy.get('svg[data-icon="grip-vertical"]').closest('button').click()
    return this
  }

  assertIsHorizontal() {
    this.getTable().should('be.visible').and('not.have.class', 'vertical-dashboard')
    return this
  }

  assertIsVertical() {
    this.getVerticalDashboardTable().should('be.visible')
    return this
  }
}

export default DashboardPage