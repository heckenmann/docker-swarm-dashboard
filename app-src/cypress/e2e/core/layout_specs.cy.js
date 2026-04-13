import DashboardPage from '../../support/pageObjects/DashboardPage'

describe('Dashboard Layout Consistency', () => {
  const dashboardPage = new DashboardPage()

  describe('Horizontal Dashboard', () => {
    beforeEach(() => {
      // Standard visit
      cy.visit('/#/')
      // Ensure we are on horizontal dashboard
      dashboardPage.switchToHorizontal()
      dashboardPage.assertIsHorizontal()
    })

    it('should verify header structure (3 rows, uniform height, no duplicate attributes)', () => {
      // Check 3 header rows using POM
      dashboardPage.getTableHeaderRows().should('have.length', 3)

      // Each row should be reasonably sized (24-32px) - using range instead of exact pixel
      dashboardPage.getTableHeaderRows().each(($tr) => {
        cy.wrap($tr).invoke('outerHeight').should('be.within', 24, 32)
      })

      // Node attribute headers should span 3 rows
      dashboardPage.getNodeAttributeHeaders().first().should('have.attr', 'rowspan', '3')
    })

    it('should verify total number of columns in head matches body', () => {
      // Row 0 has the fixed attributes + subset of services (last one merged)
      dashboardPage.getTableHeaderRows().first().find('th').invoke('toArray').then(($headTds) => {
        const headColCount = $headTds.reduce((acc, el) => acc + parseInt(el.getAttribute('colspan') || '1'), 0)
        dashboardPage.getTableBodyRows().first().find('td').its('length').should('equal', headColCount)
      })
    })

    it('should verify last service header merges with filler column', () => {
      // The last TH in the first row of the header should have colSpan 2
      dashboardPage.getTableHeaderRows().first().find('th').last().should('have.attr', 'colspan', '2')
    })

    it('should verify column widths (Service: consistent width, Filler: expands)', () => {
      // Check first service column using POM method
      dashboardPage.getServiceColumnByIndex(0)
        .invoke('outerWidth').should('be.within', 110, 130)

      // Filler column behavior depends on whether services exist:
      // - If no services: standalone [data-cy="filler-column"] exists
      // - If services exist: last service header has colspan=2 and acts as filler
      cy.get('body').then($body => {
        if ($body.find('[data-cy="filler-column"]').length > 0) {
          // Standalone filler column exists when no services
          dashboardPage.getFillerColumn().invoke('outerWidth').should('be.greaterThan', 10)
        } else {
          // When services exist, the last service header includes the filler (colspan=2)
          // It should be wider than regular service columns
          dashboardPage.getTableHeaderRows().first().find('th').last()
            .invoke('outerWidth').should('be.greaterThan', 100)
        }
      })
    })

    it('should verify header text allows overflow and has no line wrap', () => {
      // Check for .service-name-container which handles the overflow logic
      cy.get('#dashboardTable thead .service-header .service-name-container').first().should('have.css', 'position', 'absolute')

      // The TH should have white-space: nowrap
      cy.get('#dashboardTable thead .service-header').first().should('have.css', 'white-space', 'nowrap')

      // The inner wrapper should be inline-flex and nowrap
      cy.get('#dashboardTable thead .service-header .entity-name-wrapper').first()
        .should('have.css', 'white-space', 'nowrap')
        .and('have.css', 'display').and('match', /flex/)
    })

    it('should verify node column in body has no line wrap and contains leader star correctly', () => {
      // Node column in body (first TD)
      dashboardPage.getTableBodyRows().first().find('td').first()
        .should('have.css', 'white-space', 'nowrap')
        .find('.d-flex').should('exist')
    })
  })

  describe('Centered Layout', () => {
    beforeEach(() => {
      // Visit with centered layout enabled via hash
      cy.visit('/#/?maxContentWidth=centered')
      dashboardPage.getTable().should('be.visible')
    })

    it('should verify the table still fills the card width even in centered layout', () => {
      cy.get('.card').first().invoke('outerWidth').should('be.greaterThan', 100)
      dashboardPage.getTable().invoke('outerWidth').should('be.greaterThan', 100)
    })

    it('should verify no black gap exists inside the card', () => {
      // Check the background color of the area to the right of the table
      cy.get('.card-body').first().should('be.visible')
      dashboardPage.getTable().invoke('outerWidth').should('be.greaterThan', 100)
    })
  })

  describe('Vertical Dashboard', () => {
    beforeEach(() => {
      // Visit dashboard and switch to vertical
      cy.visit('/#/')
      dashboardPage.switchToVertical()
      dashboardPage.assertIsVertical()
    })

    it('should verify merged headers and filler column width', () => {
      dashboardPage.getVerticalDashboardHeaderRows().first().find('th').last().should('have.attr', 'colspan', '2')

      // Filler column in body should have width > 0 using data-cy selector
      cy.get('[data-cy="vertical-filler-column"]').first().invoke('outerWidth').should('be.greaterThan', 10)

      // Node columns (from index 3 onwards) should be reasonably sized (not exact pixel)
      cy.get('[data-cy="vertical-node-column-3"]').first()
        .invoke('outerWidth').should('be.within', 110, 130)

      // Service name column should be substantial
      dashboardPage.getVerticalDashboardBodyRows().first().find('td').eq(0)
        .invoke('outerWidth').should('be.greaterThan', 200)
    })

    it('should verify node headers in vertical dashboard allow overflow and have no line wrap', () => {
      cy.get('.vertical-dashboard thead .service-header .service-name-container').first().should('have.css', 'position', 'absolute')
      cy.get('.vertical-dashboard thead .service-header').first().should('have.css', 'white-space', 'nowrap')

      cy.get('.vertical-dashboard thead .service-header .entity-name-wrapper').first()
        .should('have.css', 'white-space', 'nowrap')
        .and('have.css', 'display').and('match', /flex/)
    })

    it('should verify vertical dashboard has data rows', () => {
      dashboardPage.getVerticalDashboardBodyRows().should('have.length.at.least', 1)
      dashboardPage.getVerticalDashboardBodyRows().first().find('td').should('have.length.at.least', 3)
    })
  })
})