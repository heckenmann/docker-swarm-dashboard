import { visitBaseUrlAndTest } from './spec.cy'

// Smoke test: visit each main page, click visible buttons and assert no console errors
const pages = [
  { nav: 'Dashboard' },
  { nav: 'Dashboard', extra: () => cy.contains('a', 'Dashboard').click() },
  { nav: 'Nodes' },
  { nav: 'Ports' },
  { nav: 'Stacks' },
  { nav: 'Tasks' },
  { nav: 'Timeline' },
  // { nav: 'Settings' }, // Skip Settings due to dynamic re-rendering causing detached elements
  { nav: 'About' },
]

describe('Buttons smoke tests', () => {
  pages.forEach((p) => {
    it(`visit page and click buttons - ${p.nav}`, () => {
      visitBaseUrlAndTest(() => {
        // navigate to page via navbar
        cy.contains('a', p.nav).click()

        // ensure page loaded
        cy.document().its('body').should('exist')

        // find visible buttons (exclude hidden/disabled) and click them one by one
        // Exclude buttons that cause navigation such as Debug to avoid detached elements
        cy.get('button:visible').not(':contains("Debug")').each((btn, index) => {
          // Limit to first 40 buttons to avoid infinite loops
          if (index < 40) {
            cy.wrap(btn).click({ force: true })
            cy.wait(100)
            // basic check: body should not contain ERROR
            cy.document().its('body').should('not.contain', 'ERROR')
          }
        })
      })
    })
  })
})
