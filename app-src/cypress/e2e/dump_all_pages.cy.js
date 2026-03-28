import { visitBaseUrlAndTest } from './spec.cy'

const pages = [
  { name: 'dashboard_h', text: 'Dashboard', hash: '/dashboard/h', isDefault: true },
  { name: 'dashboard_v', text: 'Dashboard', hash: '/dashboard/v', isDefault: false },
  { name: 'nodes', text: 'Nodes', hash: '/nodes' },
  { name: 'stacks', text: 'Stacks', hash: '/stacks' },
  { name: 'tasks', text: 'Tasks', hash: '/tasks' },
  { name: 'ports', text: 'Ports', hash: '/ports' },
  { name: 'settings', text: 'Settings', hash: '/settings' },
  { name: 'timeline', text: 'Timeline', hash: '/timeline' },
  { name: 'about', text: 'About', hash: '/about' },
]

describe('Dump all pages', () => {
  pages.forEach((p) => {
    it(`dump ${p.name}`, () => {
      visitBaseUrlAndTest(() => {
        if (p.isDefault) {
          cy.get(`a[aria-label="${p.text}"]`).click()
          cy.wait(300)
        } else if (p.name === 'dashboard_v') {
          cy.get('a[aria-label="Dashboard"]').click()
          cy.get('main').within(() => { cy.get('button').eq(1).click() })
          cy.wait(300)
        } else {
          cy.get(`a[aria-label="${p.text}"]`).click()
          cy.wait(300)
        }

        cy.document().its('body').should('exist')

        cy.document().then((d) => {
          const html = d.documentElement.outerHTML
          cy.writeFile(`cypress/dumps/${p.name}.html`, html)
        })

        cy.screenshot(`dump_${p.name}`)
      })
    })
  })
})
