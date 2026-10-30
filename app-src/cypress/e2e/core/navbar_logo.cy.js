describe('Navbar logo contrast', () => {
  for (const theme of ['light', 'dark']) {
    it(`keeps the logo on a compact light circle in ${theme} mode`, () => {
      cy.visit(
        `/#base=http%3A%2F%2Flocalhost%3A3001%2F&darkMode=${theme === 'dark'}`,
      )
      cy.get('html').should('have.attr', 'data-bs-theme', theme)

      for (const width of [1280, 390]) {
        cy.viewport(width, 844)
        cy.get('#dockerlogo').should(($logo) => {
          const logo = $logo[0]
          const bounds = logo.getBoundingClientRect()
          const style = logo.ownerDocument.defaultView.getComputedStyle(logo)
          expect(logo.naturalWidth).to.be.greaterThan(0)
          expect(bounds.width).to.equal(32)
          expect(bounds.height).to.equal(32)
          expect(style.backgroundColor).to.equal('rgb(255, 255, 255)')
          expect(style.borderRadius).to.equal('50%')
          expect(style.borderTopWidth).to.equal('1px')
        })
        cy.get('nav .navbar-brand').should(($brand) => {
          const brand = $brand[0].getBoundingClientRect()
          const navbar = $brand[0].closest('nav').getBoundingClientRect()
          expect(brand.left).to.be.at.least(navbar.left)
          expect(brand.right).to.be.at.most(navbar.right)
        })
      }
    })
  }
})
