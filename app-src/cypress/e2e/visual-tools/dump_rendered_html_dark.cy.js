describe('dump rendered HTML (dark mode)', () => {
  it('visits the app in dark mode and writes the rendered HTML to a file', () => {
    cy.viewport(1280, 900);
    cy.visit('http://localhost:3000/#base="http%3A%2F%2Flocalhost%3A3001%2F"&darkMode=true');
    cy.wait(1000);
    cy.document().then((doc) => {
      const html = doc.documentElement.outerHTML;
      cy.writeFile('cypress/dumps/dumped_page_dark.html', html);
    });
    // also take a screenshot for quick visual inspection
    cy.screenshot('dashboard-dark-mode', { capture: 'viewport' });
  });
});
