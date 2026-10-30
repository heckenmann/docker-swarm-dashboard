describe('Generated branding assets', () => {
  it('loads the new PNG in the navigation and decorative background', () => {
    cy.get('#dockerlogo')
      .should('have.attr', 'alt', 'Docker Swarm Dashboard logo')
      .and('have.attr', 'src')
      .and('include', 'swarm-dashboard')

    cy.get('#dockerlogo, img.background-image').should(($images) => {
      expect($images).to.have.length(2)
      for (const image of $images) {
        expect(image.naturalWidth).to.equal(512)
        expect(image.naturalHeight).to.equal(512)
        expect(image.src).to.equal($images[0].src)
      }
    })
  })

  it('serves the linked favicon with four icon sizes', () => {
    cy.get('link[rel="icon"]').then(($link) => {
      cy.request({ url: $link[0].href, encoding: 'binary' }).then(
        (response) => {
          expect(response.headers['content-type']).to.match(
            /image\/(x-icon|vnd\.microsoft\.icon)/,
          )
          const icon = Cypress.Buffer.from(response.body, 'binary')
          expect(icon.readUInt16LE(2)).to.equal(1)
          expect(icon.readUInt16LE(4)).to.equal(4)
        },
      )
    })
  })
})
