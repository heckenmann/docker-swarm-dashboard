describe('dump rendered HTML', () => {
  it('visits the app and writes the rendered HTML to a file', () => {
    // Set a large viewport so desktop layout is rendered
    cy.viewport(1280, 900);
    
    // Intercept API calls to wait for dynamic content to load
    cy.intercept('GET', '**/ui/dashboard*').as('getDashboard')
    cy.intercept('GET', '**/ui/dashboard-settings*').as('getSettings')
    
    cy.visit('http://localhost:3000/#base="http%3A%2F%2Flocalhost%3A3001%2F"')
    
    // Wait for dynamic content to be loaded instead of hardcoded wait
    cy.wait('@getDashboard', { timeout: 10000 })
    cy.wait('@getSettings', { timeout: 10000 })
    
    // Additional wait for table to be rendered
    cy.get('#dashboardTable').should('exist')
    cy.get('tbody tr').should('have.length.at.least', 1)
    
    cy.document().then((doc) => {
      const html = doc.documentElement.outerHTML;
      cy.writeFile('cypress/dumps/dumped_page.html', html);
    });
  });
});
