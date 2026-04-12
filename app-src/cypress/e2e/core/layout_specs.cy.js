describe('Dashboard Layout Consistency', () => {
  describe('Horizontal Dashboard', () => {
    beforeEach(() => {
      // Standard visit
      cy.visit('/#/')
      // Ensure we are on horizontal dashboard (default or via click)
      cy.get('svg[data-icon="grip"]').closest('button').click()
      cy.get('#dashboardTable').should('be.visible')
      // Ensure it's not the vertical one
      cy.get('#dashboardTable').should('not.have.class', 'vertical-dashboard')
    })

    it('should verify header structure (3 rows, uniform height, no duplicate attributes)', () => {
      // Check 3 header rows
      cy.get('#dashboardTable thead tr').should('have.length', 3)
      
      // Each row should be exactly 28px high
      cy.get('#dashboardTable thead tr').each(($tr) => {
        expect($tr[0].getBoundingClientRect().height).to.be.closeTo(28, 0.5)
      })

      // Node attribute headers (e.g., 'Node', 'Role') should span 3 rows
      cy.get('#dashboardTable thead th.node-attribute').first().should('have.attr', 'rowspan', '3')
    })

    it('should verify total number of columns in head matches body', () => {
      // Row 0 has the fixed attributes + subset of services (last one merged)
      cy.get('#dashboardTable thead tr').first().find('th').then(($headTds) => {
        let headColCount = 0
        $headTds.each((i, el) => {
          headColCount += parseInt(el.getAttribute('colspan') || '1')
        })
        
        cy.get('#dashboardTable tbody tr').first().find('td').then(($bodyTds) => {
          const bodyColCount = $bodyTds.length
          expect(headColCount).to.equal(bodyColCount, 'Header column count (summing colspans) should match body column count')
        })
      })
    })

    it('should verify last service header merges with filler column', () => {
      // The last TH in the first row of the header should have colSpan 2
      cy.get('#dashboardTable thead tr').first().find('th').last().then(($el) => {
        expect($el.attr('colspan')).to.equal('2')
      })
    })

    it('should verify column widths (Service: exactly 120px, Filler: expands)', () => {
      // Check first service column (svc-index-0)
      cy.get('#dashboardTable tbody tr').first().find('.svc-index-0').then(($el) => {
        // Must be exactly 120px
        expect($el[0].getBoundingClientRect().width).to.be.closeTo(120, 0.5)
      })

      // Filler column should be larger than 0
      cy.get('#dashboardTable tbody tr').first().find('.fill-col').then(($el) => {
        expect($el[0].getBoundingClientRect().width).to.be.at.least(10)
      })
    })

    it('should verify header text allows overflow and has no line wrap', () => {
      // Check for .service-name-container which handles the overflow logic
      cy.get('#dashboardTable thead .service-header .service-name-container').first().should('have.css', 'position', 'absolute')
      
      // The TH should have white-space: nowrap
      cy.get('#dashboardTable thead .service-header').first().should('have.css', 'white-space', 'nowrap')
      
      // The inner wrapper should be inline-flex and nowrap
      cy.get('#dashboardTable thead .service-header .entity-name-wrapper').first().then(($el) => {
        const style = window.getComputedStyle($el[0])
        expect(style.whiteSpace).to.equal('nowrap')
        expect(style.display).to.contain('flex')
      })
    })

    it('should verify node column in body has no line wrap and contains leader star correctly', () => {
      // Node column in body (first TD)
      cy.get('#dashboardTable tbody tr').first().find('td').first().then(($td) => {
        expect($td.css('white-space')).to.equal('nowrap')
        // Should contain a flex container for name and star
        cy.wrap($td).find('.d-flex').should('exist')
      })
    })
  })

  describe('Centered Layout', () => {
    beforeEach(() => {
      // Visit with centered layout enabled via hash
      cy.visit('/#/?maxContentWidth=centered')
      cy.get('#dashboardTable').should('be.visible')
    })

    it('should verify the table still fills the card width even in centered layout', () => {
      cy.get('.card').first().then(($card) => {
        const cardRect = $card[0].getBoundingClientRect()
        cy.get('#dashboardTable').then(($table) => {
          const tableRect = $table[0].getBoundingClientRect()
          
          // The table should be flush with the card's right edge
          // We allow a small tolerance for padding/borders
          expect(tableRect.right).to.be.at.least(cardRect.right - 10)
        })
      })
    })

    it('should verify no black gap exists inside the card', () => {
      // Check the background color of the area to the right of the table
      // In a centered layout, the container might be narrow, but the table
      // should still fill its immediate parent (the card body).
      cy.get('.card-body').first().then(($body) => {
        const bodyRect = $body[0].getBoundingClientRect()
        cy.get('#dashboardTable').then(($table) => {
          const tableRect = $table[0].getBoundingClientRect()
          
          // If there's a gap, the body's right will be significantly greater than table's right
          expect(tableRect.right).to.be.at.least(bodyRect.right - 2)
        })
      })
    })
  })

  describe('Vertical Dashboard', () => {
    beforeEach(() => {
      // Visit dashboard and switch to vertical
      cy.visit('/#/')
      cy.get('svg[data-icon="grip-vertical"]').closest('button').click()
      cy.get('.vertical-dashboard').should('be.visible')
    })

    it('should verify merged headers and filler column width', () => {
      cy.get('.vertical-dashboard thead tr').first().find('th').last().then(($el) => {
        expect($el.attr('colspan')).to.equal('2')
      })

      // Filler column in body should have width > 0
      cy.get('.vertical-dashboard tbody tr').first().find('.fill-col').then(($el) => {
        expect($el[0].getBoundingClientRect().width).to.be.at.least(10)
      })

      // Node columns (from index 3 onwards) should be exactly 120px
      cy.get('.vertical-dashboard tbody tr').first().find('td').eq(3).then(($el) => {
        expect($el[0].getBoundingClientRect().width).to.be.closeTo(120, 0.5)
      })
      
      // Service name column should be substantial
      cy.get('.vertical-dashboard tbody tr').first().find('td').eq(0).then(($el) => {
        expect($el[0].getBoundingClientRect().width).to.be.at.least(239)
      })
    })

    it('should verify node headers in vertical dashboard allow overflow and have no line wrap', () => {
      cy.get('.vertical-dashboard thead .service-header .service-name-container').first().should('have.css', 'position', 'absolute')
      cy.get('.vertical-dashboard thead .service-header').first().should('have.css', 'white-space', 'nowrap')
      
      cy.get('.vertical-dashboard thead .service-header .entity-name-wrapper').first().then(($el) => {
        const style = window.getComputedStyle($el[0])
        expect(style.whiteSpace).to.equal('nowrap')
        expect(style.display).to.contain('flex')
      })
    })

    it('should verify vertical dashboard has data rows', () => {
      cy.get('.vertical-dashboard tbody tr').should('have.length.at.least', 1)
      cy.get('.vertical-dashboard tbody tr').first().find('td').should('have.length.at.least', 3)
    })
  })
})
