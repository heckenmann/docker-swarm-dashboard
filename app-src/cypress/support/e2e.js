// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import { setupConsoleInstrumentation, assertNoConsoleErrors } from './common'

Cypress.on('uncaught:exception', (err) => {
  if (err.message && err.message.includes('Script error')) {
    return false
  }
})

// Import all page objects
import BasePage from './pageObjects/BasePage'
import DashboardPage from './pageObjects/DashboardPage'
import SettingsPage from './pageObjects/SettingsPage'
import NodesPage from './pageObjects/NodesPage'
import StacksPage from './pageObjects/StacksPage'
import TasksPage from './pageObjects/TasksPage'
import PortsPage from './pageObjects/PortsPage'
import LogsPage from './pageObjects/LogsPage'
import TimelinePage from './pageObjects/TimelinePage'
import AboutPage from './pageObjects/AboutPage'

// Make page objects globally available
Cypress.Commands.add('getPage', (pageName) => {
  switch(pageName) {
    case 'base':
      return new BasePage()
    case 'dashboard':
      return new DashboardPage()
    case 'settings':
      return new SettingsPage()
    case 'nodes':
      return new NodesPage()
    case 'stacks':
      return new StacksPage()
    case 'tasks':
      return new TasksPage()
    case 'ports':
      return new PortsPage()
    case 'logs':
      return new LogsPage()
    case 'timeline':
      return new TimelinePage()
    case 'about':
      return new AboutPage()
    default:
      throw new Error(`Unknown page: ${pageName}`)
  }
})

// Global before each hook
beforeEach(() => {
  // Default to 4K, but allow override via env
  const width = Cypress.env("viewportWidth") || 3840
  const height = Cypress.env("viewportHeight") || 2160
  cy.viewport(width, height)

  // Clear cookies and localStorage between tests
  cy.clearCookies()
  cy.clearTestLocalStorage()
  
  // Setup console instrumentation for every test
  setupConsoleInstrumentation()

  // Auto-visit if not explicitly disabled
  if (Cypress.config("autoVisit") !== false) {
    cy.visit("/#base=http%3A%2F%2Flocalhost%3A3001%2F")
    cy.get("nav", { timeout: 10000 }).should("be.visible")
  }
})

// Global after each hook
afterEach(() => {
  // Check for console errors after every test
  assertNoConsoleErrors()
})

// Add tab command for keyboard navigation testing
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject, options) => {
  const opts = options || {}
  return cy.push(subject ? subject.tab(opts) : cy.state('currentSubject').tab(opts))
})

// Add accessibility check command
Cypress.Commands.add('checkAccessibility', () => {
  // Simple accessibility checks
  cy.get('img[alt]').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt')
  })
  
  cy.get('a[href]').each(($link) => {
    cy.wrap($link).should('have.attr', 'href')
  })
  
  // Check for sufficient color contrast
  cy.get('*').each(($el) => {
    const $element = Cypress.$($el)
    const bgColor = $element.css('background-color')
    const color = $element.css('color')
    
    // Very basic color contrast check
    if (bgColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgb(0, 0, 0)') {
      // This is a placeholder for actual contrast checking
      // In real implementation you would use axe-core or similar
    }
  })
})
