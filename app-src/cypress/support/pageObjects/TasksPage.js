import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Tasks interactions
 */
class TasksPage {
  visit() {
    cy.visit(CY_BASE_URL)
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Tasks"]').click()
    return this
  }
  
  getTaskTable() {
    return cy.get('[data-cy="tasks-table"]')
  }
  
  getTaskRows() {
    return cy.get('[data-cy="task-row"]')
  }
  
  getTaskById(taskId) {
    return cy.contains('[data-cy="task-id"]', taskId)
  }
  
  clickTaskDetails(taskId) {
    this.getTaskById(taskId).click()
    return this
  }
  
  getStatusFilter() {
    return cy.get('[data-cy="status-filter"]')
  }
  
  filterByStatus(status) {
    this.getStatusFilter().select(status)
    return this
  }
  
  getNodeIdFilter() {
    return cy.get('[data-cy="node-id-filter"]')
  }
  
  filterByNodeId(nodeId) {
    this.getNodeIdFilter().select(nodeId)
    return this
  }
  
  getSearchInput() {
    return cy.get('input[aria-label="Search tasks"]')
  }
  
  searchTasks(query) {
    this.getSearchInput().clear().type(query)
    return this
  }
  
  assertTaskExists(taskId) {
    this.getTaskById(taskId).should('exist')
    return this
  }
  
  assertTaskCount(count) {
    this.getTaskRows().should('have.length', count)
    return this
  }
}

export default TasksPage