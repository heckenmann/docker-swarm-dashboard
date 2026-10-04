
describe('Console errors dynamic (fast)', () => {
  it('visits a few nav pages and clicks detail buttons, failing fast on console or network errors', () => {
    
      const MAX_PAGES = 3
      const MAX_BUTTONS = 4
      let interceptedResponses = []

      // intercept docker API responses to detect HTTP failures
      cy.intercept('**/docker/**', (req) => {
        req.on('response', (res) => {
          interceptedResponses.push({ url: req.url, status: res.statusCode })
        })
      })

      // Visit up to MAX_PAGES top nav items and click up to MAX_BUTTONS detail buttons each
      cy.get('nav a.nav-link, nav .nav-link', { timeout: 5000 })
        .then(($navs) => Array.from($navs).map(n => n.getAttribute('aria-label')).filter(Boolean).slice(0, MAX_PAGES))
        .then((texts) => {
          return cy.wrap(texts).each((linkText) => {
            interceptedResponses = []
            cy.get(`nav a[aria-label="${linkText}"]`, { timeout: 3000 }).click()

            // Check for buttons synchronously first so we don't fail the test when a page
            // legitimately has no detail buttons (cy.get would retry and eventually fail).
            cy.document().then((doc) => {
              const btns = Array.from(doc.querySelectorAll('button.name-open-btn, .name-open-btn'))
              const available = btns.length || 0
              const count = Math.min(available, MAX_BUTTONS)
              if (!count) return

              // Instead of wrapping raw elements that may detach, re-query before each click.
              for (let i = 0; i < count; i++) {
                // Synchronously check the document for current buttons to avoid
                // cy.get timeouts if the DOM is transient. Use Cypress.$ for a
                // fast lookup, then wrap the element for a Cypress click.
                cy.document().then((doc) => {
                  const $current = Cypress.$('button.name-open-btn, .name-open-btn', doc)
                  if (!$current || $current.length <= i) {
                    // Not enough buttons currently available; skip this iteration
                    return
                  }
                  cy.wrap($current.eq(i)).should('exist').click({ force: true })
                })

                // fail fast: check console and network errors now
                cy.window().then((win) => {
                  const errors = win.__consoleErrors || []
                  if (errors.length > 0) throw new Error(`console.error on ${linkText} idx=${i}: ${JSON.stringify(errors)}`)
                  const bad = (interceptedResponses || []).filter(r => r && Number(r.status) >= 400)
                  if (bad && bad.length > 0) throw new Error(`network errors on ${linkText} idx=${i}: ${JSON.stringify(bad)}`)
                })

                // return to page for next interaction
                cy.get(`nav a[aria-label="${linkText}"]`, { timeout: 2000 }).click()
              }
            })
          })
        })
    
  })
})
