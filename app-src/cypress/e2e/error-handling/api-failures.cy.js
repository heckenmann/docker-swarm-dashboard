describe('API Failure Handling Tests', () => {
  it('should show error message when API fails', () => {
    // Intercept ALL UI API calls and return 500
    cy.intercept('GET', '**/ui/**', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('apiFail');

    cy.visit("/#base=http%3A%2F%2Flocalhost%3A3001%2F")
    
    // The ErrorBoundary should catch the failed atom fetch
    cy.contains('h4', 'Error', { timeout: 15000 }).should('be.visible');
    cy.contains('An unexpected error occurred').should('be.visible');
    // React logs the intentionally triggered API error in development
    // and production. Assert it explicitly before the global console guard.
    cy.window().then((win) => {
      expect(win.__consoleErrors).to.have.length.greaterThan(0)
      win.__consoleErrors.forEach((args) => {
        const error = args.find((value) => value && value.name === 'Error')
        expect(error, 'the injected API response fails with HTTP 500').to.exist
        expect(error.message).to.equal('API Error: 500 Internal Server Error')
      })
      win.__consoleErrors = []
    })
  });

  it('should handle empty service list gracefully', () => {
    // Intercept dashboard settings (must succeed)
    cy.intercept('GET', '**/ui/dashboard-settings', {
      statusCode: 200,
      body: { 
        refreshInterval: '5s',
        tableSize: 'sm',
        isDarkMode: false
      }
    });

    // Intercept dashboard data (return empty)
    cy.intercept('GET', '**/ui/dashboard*', {
      statusCode: 200,
      body: { Services: [], Nodes: [] }
    }).as('getDashboardEmpty');

    cy.visit("/#base=http%3A%2F%2Flocalhost%3A3001%2F")
    
    // Should show an empty table or "No services"
    cy.get('body').contains(/No services|Dashboard/i, { timeout: 10000 });
  });
});
