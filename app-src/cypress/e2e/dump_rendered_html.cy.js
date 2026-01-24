describe('dump rendered HTML', () => {
  it('visits the app and writes the rendered HTML to a file', () => {
    // Set a large viewport so desktop layout is rendered
    cy.viewport(1280, 900);
    cy.visit('http://localhost:3000/#base="http%3A%2F%2Flocalhost%3A3001%2F"');
    // wait a little for client JS to render dynamic content
    cy.wait(1000);
    cy.document().then((doc) => {
      const html = doc.documentElement.outerHTML;
      cy.writeFile('cypress/dumps/dumped_page.html', html);
    });
  });
});
