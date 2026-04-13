describe('dump rendered HTML (dark mode)', () => {
  it('visits the app in dark mode and writes the rendered HTML to a file', () => {
    cy.viewport(1280, 900);
    
    // Intercept API calls to wait for dynamic content
    cy.intercept('GET', '**/ui/dashboard*').as('getDashboard')
    cy.intercept('GET', '**/ui/dashboard-settings*').as('getSettings')
    
    cy.visit('http://localhost:3000/#base="http%3A%2F%2Flocalhost%3A3001%2F"&darkMode=true');
    
    // Wait for dynamic content to be loaded instead of hardcoded wait
    cy.wait('@getDashboard', { timeout: 10000 })
    cy.wait('@getSettings', { timeout: 10000 })
    
    // Ensure dashboard table is rendered before screenshot
    cy.get('#dashboardTable').should('exist')
    cy.get('tbody tr').should('have.length.at.least', 1)
    
    cy.document().then((doc) => {
      const html = doc.documentElement.outerHTML;
      cy.writeFile('cypress/dumps/dumped_page_dark.html', html);
    });
    // also take a screenshot for quick visual inspection
    cy.screenshot('dashboard-dark-mode', { capture: 'viewport' });
  });
});
