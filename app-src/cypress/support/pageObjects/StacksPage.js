import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Stacks interactions
 */
class StacksPage {
  visit() {
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Stacks"]').click()
    return this
  }
  
  getStackRowByName(stackName) {
    return cy.contains('td', stackName)
  }
  
  getStackHeaderByName(stackName) {
    return cy.contains('.card-header strong', stackName)
  }
  
  assertStackRowVisible(stackName) {
    this.getStackRowByName(stackName).should('be.visible')
    return this
  }
  
  assertStackHeaderVisible(stackName) {
    this.getStackHeaderByName(stackName).should('be.visible')
    return this
  }
}

export default StacksPage