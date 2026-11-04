import { CY_BASE_URL } from './constants'

const consoleErrors = []
const consoleWarnings = []

function instrumentConsole(win) {
  win.__consoleErrors = consoleErrors
  win.__consoleWarns = consoleWarnings

  const originalError = win.console.error.bind(win.console)
  const originalWarn = win.console.warn.bind(win.console)
  win.console.error = (...args) => {
    consoleErrors.push(args)
    originalError(...args)
  }
  win.console.warn = (...args) => {
    consoleWarnings.push(args)
    originalWarn(...args)
  }
}

// Keep the listener across page reloads and test retries, including in browsers
// where the AUT window is replaced during cy.reload().
Cypress.on('window:before:load', instrumentConsole)

/**
 * Capture console errors and warnings on each application window before load.
 */
export function setupConsoleInstrumentation() {
  consoleErrors.length = 0
  consoleWarnings.length = 0
}

/**
 * Assert that the instrumented application window has no console diagnostics.
 */
export function assertNoConsoleErrors() {
  cy.window().then((win) => {
    expect(
      win.__consoleErrors,
      `console.error: ${JSON.stringify(win.__consoleErrors)}`,
    )
      .to.be.an('array')
      .and.have.length(0)
    expect(
      win.__consoleWarns,
      `console.warn: ${JSON.stringify(win.__consoleWarns)}`,
    )
      .to.be.an('array')
      .and.have.length(0)
  })
}

/**
 * Clear console buffers after explicitly asserting expected diagnostics.
 */
export function clearConsoleErrors() {
  cy.window().then((win) => {
    consoleErrors.length = 0
    consoleWarnings.length = 0
    win.__consoleErrors = consoleErrors
    win.__consoleWarns = consoleWarnings
  })
}

export { CY_BASE_URL }
