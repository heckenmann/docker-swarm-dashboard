
describe('Dump Dashboard Table HTML', () => {
  it('Enables dark mode and dumps #dashboardTable HTML', () => {
    // The auto-visit in beforeEach will take us to the app
    
    // Go to Settings and enable Dark Mode
    cy.get('a[aria-label="Settings"]').click()
    cy.get('input[aria-label="Toggle dark mode"]').check({ force: true })
    
    // Go back to Dashboard
    cy.get('a[aria-label="Dashboard"]').click()
    cy.get('#dashboardTable', { timeout: 10000 }).should('exist')
    
    // Wait a bit for everything to settle
    cy.wait(2000);
    
    // Dump the HTML of #dashboardTable
    cy.get('#dashboardTable').then(($table) => {
      const html = $table[0].outerHTML;
      cy.writeFile('cypress/dumps/dashboard_table_dark.html', html);
    });
  });
});
