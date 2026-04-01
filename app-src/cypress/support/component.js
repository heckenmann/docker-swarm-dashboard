// ***********************************************************
// This example support/component.js is processed and
// loaded automatically before your component test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'component.supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import global styles
import '../../src/index.css'

// Import commands
import './commands'

// Mock window.matchMedia for testing media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock window.scrollTo for testing
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})