describe('Background dashboard refresh', () => {
  for (const filterValue of ['', 'front']) {
    it(`keeps ${filterValue ? 'filtered' : 'unfiltered'} content and keyboard focus during a five-second refresh`, () => {
      let initialResponse
      let completeRefresh
      let refreshStarted = false
      cy.intercept('GET', '**/ui/dashboardh', (request) => {
        if (!initialResponse) {
          request.on('before:response', (response) => {
            // Ensure every visit reaches the interceptor, including in Firefox.
            response.headers['cache-control'] = 'no-store'
            initialResponse = response.body
          })
          return
        }
        refreshStarted = true
        return new Cypress.Promise((resolve) => {
          completeRefresh = () => {
            request.reply({
              body: initialResponse,
              headers: { 'cache-control': 'no-store' },
            })
            resolve()
          }
        })
      }).as('dashboard')

      cy.clock(Date.now(), ['setInterval', 'clearInterval'])
      cy.visit('/#base=http%3A%2F%2Flocalhost%3A3001%2F&refreshInterval=5000')
      cy.wait('@dashboard')
      cy.get('#dashboardTable').should('be.visible')
      const filterInput = cy
        .get('input[aria-label="Filter by service name"]')
        .click()
      if (filterValue) filterInput.type(filterValue)
      cy.get('input[aria-label="Filter by service name"]').then(($filter) => {
        const filter = $filter[0]
        cy.tick(5000)
        cy.wrap(null).should(() => {
          expect(refreshStarted, 'background request started').to.equal(true)
        })
        cy.get('.loading-bar').should('have.class', 'visible')
        cy.get('#dashboardTable').should('be.visible')
        cy.focused().should(($focused) => {
          expect($focused[0]).to.equal(filter)
        })
        cy.then(() => completeRefresh())
        cy.wait('@dashboard')
        cy.get('#dashboardTable').should('be.visible')
        cy.focused().should(($focused) => {
          expect($focused[0]).to.equal(filter)
        })
        cy.get('input[aria-label="Filter by service name"]')
          .should('have.value', filterValue)
          .type('end')
          .should('have.value', `${filterValue}end`)
      })
    })
  }
})
