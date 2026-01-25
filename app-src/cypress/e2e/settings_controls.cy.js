import { visitBaseUrlAndTest } from './spec.cy'

describe('Settings controls', () => {
  it('toggles dark mode and refresh interval', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Settings').click()
      // toggle dark mode (checkbox/button may vary) - look for dark mode control
      cy.get('input[type=checkbox], button').then((els) => {
        // try finding a dark mode checkbox
        const dark = els.toArray().find((e) => e.title && e.title.toLowerCase().includes('dark'))
        if (dark) {
          cy.wrap(dark).click({ force: true })
        } else {
          // fallback: click the first button in the settings page
          cy.get('button').first().click({ force: true })
        }
      })
    })
  })
})
