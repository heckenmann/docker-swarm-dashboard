import { visitBaseUrlAndTest } from './spec.cy'

const pages = [
  { nav: 'Dashboard' },
  { nav: 'Dashboard', extra: () => cy.get('a[aria-label="Dashboard"]').click() },
  { nav: 'Nodes' },
  { nav: 'Ports' },
  { nav: 'Stacks' },
  { nav: 'Tasks' },
  { nav: 'Timeline' },
  { nav: 'About' },
]

describe('Buttons smoke tests', () => {
  pages.forEach((p) => {
    it(`visit page and click buttons - ${p.nav}`, () => {
      visitBaseUrlAndTest(() => {
        cy.get(`a[aria-label="${p.nav}"]`).click()
        cy.document().its('body').should('exist')

        cy.get('button:visible').not(':contains("Debug")').then((buttons) => {
          const maxClicks = Math.min(buttons.length, 10)
          for (let i = 0; i < maxClicks; i++) {
            buttons[i].click()
            cy.wait(150)
          }
        })

        cy.document().its('body').should('not.contain', 'ERROR')
      })
    })
  })
})