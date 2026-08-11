describe('Frozen dashboard header and first column', () => {
  const scrollAndAssertPinned = () => {
    cy.get('.dashboard-table-wrapper').as('wrapper')

    // Make the table taller than its container so it actually scrolls, the
    // way a cluster with hundreds of services would.
    cy.get('@wrapper').then(($wrapper) => {
      const tbody = $wrapper.find('#dashboardTable tbody')[0]
      const rows = Array.from(tbody.children)
      for (let i = 0; i < 25; i++) {
        rows.forEach((row) => tbody.appendChild(row.cloneNode(true)))
      }
    })

    cy.get('@wrapper').scrollTo(400, 400)

    cy.get('@wrapper').then(($wrapper) => {
      const box = $wrapper[0].getBoundingClientRect()
      const header = $wrapper.find('#dashboardTable thead th')[0]
      const firstCell = $wrapper.find('#dashboardTable tbody tr td')[0]

      // Both stay flush with the edges of the scroll container.
      expect(header.getBoundingClientRect().top - box.top).to.be.closeTo(0, 2)
      expect(firstCell.getBoundingClientRect().left - box.left).to.be.closeTo(
        0,
        2,
      )
    })
  }

  it('keeps the header and the first column visible in the horizontal layout', () => {
    cy.get('a[aria-label="Dashboard"]').click()
    cy.get('#dashboardTable', { timeout: 10000 }).should('exist')
    scrollAndAssertPinned()
  })

  it('keeps the header and the first column visible in the vertical layout', () => {
    cy.visit('/#base=http%3A%2F%2Flocalhost%3A3001%2F&defaultLayout=%22column%22')
    cy.get('#dashboardTable', { timeout: 10000 }).should('exist')
    scrollAndAssertPinned()
  })
})
