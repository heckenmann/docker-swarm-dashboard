describe('Node metrics refresh', () => {
  const visitNodes = (refreshInterval = 'null') => {
    cy.visit(
      `/#base=http%3A%2F%2Flocalhost%3A3001%2F&refreshInterval=${refreshInterval}`,
    )
    cy.get('a[aria-label="Nodes"]').click()
    cy.get('#nodes-table').should('be.visible')
  }

  const assertBars = (percent) => {
    // Requery after async refreshes instead of holding detached progress bars.
    cy.get('#nodes-table tbody tr:first-child [role="progressbar"]').should(
      ($bars) => {
        expect($bars).to.have.length(2)
        for (const bar of $bars) {
          expect(bar.getAttribute('aria-valuenow')).to.equal(String(percent))
        }
      },
    )
  }

  const metrics = (availableMemory) => ({
    available: true,
    metrics: {
      memory: { total: 100, available: availableMemory },
      filesystem: [{ mountpoint: '/', size: 100, used: 100 - availableMemory }],
    },
  })

  it('updates memory and disk bars after manual refresh and returning to Nodes', () => {
    let availableMemory = 50
    cy.intercept('GET', '**/docker/nodes/*/metrics', (request) => {
      request.reply(metrics(availableMemory))
    }).as('nodeMetrics')
    visitNodes()
    assertBars(50)
    cy.then(() => {
      availableMemory = 20
    })
    cy.get('button[aria-label="Refresh"]').click()
    cy.wait('@nodeMetrics')
    assertBars(80)
    cy.get('a[aria-label="Stacks"]').click()
    cy.then(() => {
      availableMemory = 90
    })
    cy.get('a[aria-label="Nodes"]').click()
    assertBars(10)
  })

  it('recovers unavailable node metrics during automatic refresh', () => {
    let response = { available: false }
    cy.intercept('GET', '**/docker/nodes/*/metrics', (request) => {
      request.reply(response)
    }).as('nodeMetrics')
    cy.clock(Date.now(), ['setInterval', 'clearInterval'])
    visitNodes('5000')
    cy.get('#nodes-table tbody tr').first().contains('N/A').should('be.visible')
    cy.then(() => {
      response = metrics(20)
    })
    cy.tick(5000)
    cy.wait('@nodeMetrics')
    assertBars(80)
  })
})
