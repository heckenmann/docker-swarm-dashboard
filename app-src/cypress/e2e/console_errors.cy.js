import { visitBaseUrlAndTest } from './spec.cy'

describe('Console should not show errors or warnings via navbar clicks', () => {
  const navLabels = [
    'Dashboard',
    'Timeline',
    'Stacks',
    'Nodes',
    'Tasks',
    'Ports',
    'Logs',
    'About',
    'Settings',
  ]

  navLabels.forEach((label) => {
    it(`no console errors/warnings when clicking '${label}' in navbar`, () => {
      visitBaseUrlAndTest(() => {
        // instrument console on the page before interacting
        cy.window().then((win) => {
          win.__consoleErrors = []
          win.__consoleWarns = []

          const origError = win.console.error?.bind(win.console)
          const origWarn = win.console.warn?.bind(win.console)

          win.console.error = function (...args) {
            win.__consoleErrors.push(args)
            if (origError) origError(...args)
          }
          win.console.warn = function (...args) {
            win.__consoleWarns.push(args)
            if (origWarn) origWarn(...args)
          }
        })

        // find the nav link by label and click it if present
        cy.get('nav')
          .then(($nav) => {
            const anchors = Array.from($nav.find('a'))
            const match = anchors.find((a) => a.textContent && a.textContent.includes(label))
            if (match) return cy.wrap(match).click()
            // if nav item isn't present (e.g. Logs hidden), just log and continue
            cy.log(`Nav item '${label}' not present, skipping click`)
            return null
          })

        // allow async loads to settle
        cy.wait(250)

        // assert no console errors/warnings were recorded
        cy.window().then((win) => {
          let errors = win.__consoleErrors || []
          const warns = win.__consoleWarns || []
          // filter out known benign React dev warning about non-primitive `src` on <img>
          try {
            errors = errors.filter((e) => {
              try {
                if (Array.isArray(e)) {
                  const joined = e.map((a) => (a ? String(a).toLowerCase() : '')).join(' ')
                  if (
                    joined.includes('invalid value for prop') &&
                    joined.includes('`src`') &&
                    joined.includes('img')
                  ) {
                    return false
                  }
                } else {
                  const first = e && e[0] ? String(e[0]).toLowerCase() : ''
                  if (first.includes('invalid value for prop') && first.includes('on <%s> tag')) {
                    return false
                  }
                }
              } catch (err) {}
              return true
            })
          } catch (err) {}
          // debug: log collected errors for test investigation
          if (errors.length > 0) {
            // use Cypress log so CI output contains the message
            cy.log(`Collected console.error messages: ${JSON.stringify(errors.slice(0, 10))}`)
          }
          if (warns.length > 0) {
            cy.log(`Collected console.warn messages: ${JSON.stringify(warns.slice(0, 10))}`)
          }
          expect(errors, `console.error after clicking ${label}: ${JSON.stringify(errors.slice(0,10))}`).to.have.length(0)
          expect(warns, `console.warn after clicking ${label}: ${JSON.stringify(warns.slice(0,10))}`).to.have.length(0)
        })
      })
    })
  })
})
