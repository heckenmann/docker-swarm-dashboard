// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import { CY_BASE_URL } from './constants'

// Custom command to visit base URL with proper initialization
Cypress.Commands.add('visitBaseUrl', () => {
  cy.visit(CY_BASE_URL)
  cy.get('nav', { timeout: 10000 }).should('be.visible')
})

// Custom command to check for console errors
Cypress.Commands.add('assertNoConsoleErrors', () => {
  cy.window().then((win) => {
    const c = win.console || {}
    const errors = c.__errors || []
    // If the app hasn't instrumented console, fallback to assuming no errors
    expect(Array.isArray(errors) ? errors.length : 0).to.eq(
      0,
      `Console errors: ${JSON.stringify(errors)}`
    )
  })
  cy.document().its('body').should('not.contain', 'ERROR')
})

// Custom command to set localStorage values (avoiding conflict with built-in)
Cypress.Commands.add('setTestLocalStorage', (key, value) => {
  cy.window().then(window => {
    window.localStorage.setItem(key, JSON.stringify(value))
  })
})

// Custom command to get localStorage values (avoiding conflict with built-in)
Cypress.Commands.add('getTestLocalStorage', (key) => {
  cy.window().then(window => {
    return window.localStorage.getItem(key)
  })
})

// Custom command to clear localStorage (avoiding conflict with built-in)
Cypress.Commands.add('clearTestLocalStorage', () => {
  cy.window().then(window => {
    window.localStorage.clear()
  })
})

// Custom command to wait for application loading
Cypress.Commands.add('waitForAppLoad', () => {
  cy.get('nav', { timeout: 10000 }).should('be.visible')
})

// Custom command to test responsive behavior
Cypress.Commands.add('setViewport', (width, height) => {
  cy.viewport(width, height)
})

// Custom command to check element visibility
Cypress.Commands.add('isVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible')
})

// Custom command to check element is not visible
Cypress.Commands.add('isNotVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('not.be.visible')
})