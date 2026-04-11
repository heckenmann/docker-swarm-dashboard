
describe('Service Status Badges List Style', () => {
  it('should not have list bullets in the horizontal dashboard', () => {
    
      // Ensure we are on the dashboard
      cy.get('a[aria-label="Dashboard"]').click()
      cy.get('#dashboardTable', { timeout: 10000 }).should('exist')
      
      // Select all task list items in the table
      cy.get('#dashboardTable ul li').each(($li) => {
        // Check computed style for list-style-type
        const style = window.getComputedStyle($li[0])
        // Log for debugging
        cy.log('List item style: ' + style.listStyleType)
        expect(style.listStyleType).to.equal('none', 'List item should not have bullets')
      })
    })

  it('should not have list bullets in the vertical dashboard', () => {
    
      cy.get('a[aria-label="Dashboard"]').click()
      
      // Toggle to vertical layout using the button in DashboardSettingsComponent
      cy.get('button .fa-grip-vertical').parent().click()
      
      // Wait for table to be present
      cy.get('.dashboard-table', { timeout: 10000 }).should('exist')
      
      // Select all task list items in the table
      cy.get('.dashboard-table ul li').each(($li) => {
        const style = window.getComputedStyle($li[0])
        cy.log('Vertical list item style: ' + style.listStyleType)
        expect(style.listStyleType).to.equal('none', 'Vertical list item should not have bullets')
      })
    })
  })
