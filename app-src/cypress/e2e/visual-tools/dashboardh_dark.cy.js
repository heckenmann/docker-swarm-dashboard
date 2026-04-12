
describe('Dashboard horizontal Dark Mode Tests', () => {
  it('Horizontal dashboard table should fill available width in dark mode', () => {
    
      // Go to Settings and enable Dark Mode
      cy.get('a[aria-label="Settings"]').click()
      cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
      
      // Go back to Dashboard
      cy.get('a[aria-label="Dashboard"]').click()
      cy.get('#dashboardTable', { timeout: 5000 }).should('exist')
      
      // Verify dark mode class is applied to app root
      cy.get('.app').should('have.class', 'theme-dark')
      
      // Capture screenshots
      cy.screenshot('01_dashboard_full_layout_dark', { capture: 'fullPage' })
      cy.screenshot('04_dashboard_4k_viewport_dark', { capture: 'viewport' })
      
      // Test 1: The last td should extend to the right edge of the table
      cy.get('#dashboardTable tbody tr:first-child td:last-child').then(($lastTd) => {
        const tdRight = $lastTd[0].getBoundingClientRect().right
        cy.get('#dashboardTable').then(($table) => {
          const tableRight = $table[0].getBoundingClientRect().right
          const remainingSpace = tableRight - tdRight
          
          cy.log('Table Right: ' + tableRight)
          cy.log('Last TD Right: ' + tdRight)
          cy.log('Remaining Space: ' + remainingSpace)
          
          expect(remainingSpace).to.be.lte(2, 
            'Last TD right edge should match table right edge. Remaining space: ' + remainingSpace + 'px'
          )
        })
      })
      
      // Test 2: The table should extend to the right edge of the DSDCard
      cy.get('#dashboardTable').then(($table) => {
        const tableRight = $table[0].getBoundingClientRect().right
        cy.get('#dashboardTable').closest('.card').then(($card) => {
          const cardRight = $card[0].getBoundingClientRect().right
          const tableToCardDiff = cardRight - tableRight
          
          cy.log('Card Right: ' + cardRight)
          cy.log('Table Right: ' + tableRight)
          cy.log('Difference: ' + tableToCardDiff)
          
          expect(tableToCardDiff).to.be.lte(2,
            'Table right edge should match card right edge. Difference: ' + tableToCardDiff + 'px'
          )
        })
      })
  })
})
