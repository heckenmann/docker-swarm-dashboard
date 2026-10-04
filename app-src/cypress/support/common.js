import { CY_BASE_URL } from './constants'

/**
 * Capture console errors and warnings on each application window before load.
 * Cypress removes this listener at the end of the current test.
 */
export function setupConsoleInstrumentation() {
  cy.on('window:before:load', (win) => {
    win.__consoleErrors = []
    win.__consoleWarns = []

    const originalError = win.console.error.bind(win.console)
    const originalWarn = win.console.warn.bind(win.console)
    win.console.error = (...args) => {
      win.__consoleErrors.push(args)
      originalError(...args)
    }
    win.console.warn = (...args) => {
      win.__consoleWarns.push(args)
      originalWarn(...args)
    }
  })
}

/**
 * Assert that the instrumented application window has no console diagnostics.
 */
export function assertNoConsoleErrors() {
  cy.window().then((win) => {
    expect(win.__consoleErrors, 'console.error')
      .to.be.an('array')
      .and.have.length(0)
    expect(win.__consoleWarns, 'console.warn')
      .to.be.an('array')
      .and.have.length(0)
  })
}

/**
 * Clear console buffers after explicitly asserting expected diagnostics.
 */
export function clearConsoleErrors() {
  cy.window().then((win) => {
    win.__consoleErrors = []
    win.__consoleWarns = []
  })
}

export { CY_BASE_URL }
