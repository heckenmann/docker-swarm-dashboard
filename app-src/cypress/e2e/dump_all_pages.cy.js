import { visitBaseUrlAndTest } from './spec.cy'

const pages = [
  { name: 'dashboard_h', text: 'Dashboard', hash: '/dashboard/h' },
  { name: 'dashboard_v', text: 'Dashboard vertical', hash: '/dashboard/v' },
  { name: 'nodes', text: 'Nodes', hash: '/nodes' },
  { name: 'stacks', text: 'Stacks', hash: '/stacks' },
  { name: 'services', text: 'Services', hash: '/services' },
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
        // try to click the nav link by text; if it doesn't exist, fallback to direct hash visit
        // try anchors or buttons (navbar items were switched to Buttons)
        cy.get('a,button')
          .then(($els) => {
            const found = Array.from($els).find((el) =>
              el.textContent && el.textContent.trim().includes(p.text),
            )
            if (found) {
              cy.wrap(found).click({ force: true })
              cy.wait(300)
            } else {
              // direct visit via hash fallback
              const encoded = encodeURIComponent(`http://localhost:3001${p.hash}`)
              cy.visit(`#base="${encoded}"`)
              cy.wait(300)
            }
          })
        // wait for body to have content
        cy.document().its('body').should('exist')

  // write the current HTML to file
        cy.document().then((d) => {
          const html = d.documentElement.outerHTML
          // use cy.writeFile to store the dump
          cy.writeFile(`cypress/dumps/${p.name}.html`, html)
        })

        // take a screenshot for visual inspection
        cy.screenshot(`dump_${p.name}`)
      })
    })
  })
})
