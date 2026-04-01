import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for About interactions
 */
class AboutPage {
  visit() {
    cy.visit(CY_BASE_URL)
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="About"]').click()
    return this
  }
  
  getVersionInfo() {
    return cy.get('[data-cy="version-info"]')
  }
  
  getReleaseNotes() {
    return cy.get('[data-cy="release-notes"]')
  }
  
  getGitHubLink() {
    return cy.get('[data-cy="github-link"]')
  }
  
  getDebugInfoButton() {
    return cy.get('[data-cy="debug-info-button"]')
  }
  
  clickDebugInfo() {
    this.getDebugInfoButton().click()
    return this
  }
  
  assertVersionDisplayed() {
    this.getVersionInfo().should('be.visible')
    return this
  }
  
  assertGitHubLinkWorks() {
    this.getGitHubLink().should('have.attr', 'href')
    return this
  }
}

export default AboutPage