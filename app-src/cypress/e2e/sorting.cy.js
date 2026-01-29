import { visitBaseUrlAndTest } from './spec.cy'

describe('Table Sorting Tests', () => {
  it('Nodes table sorting works', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Nodes').click()

      // Before sorting, light arrows should be visible on all headers
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')

      // Click the Node header to sort
      cy.get('#nodes-table thead th').contains('Node').click()

      // Verify sort indicator appears (should be solid now)
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')

      // Click again to reverse sort
      cy.get('#nodes-table thead th').contains('Node').click()

      // Verify sort indicator still appears (direction changed)
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')

      // Reset button should be visible when sorted
      cy.contains('button', 'Reset Sort').should('be.visible')

      // Click reset button
      cy.contains('button', 'Reset Sort').click()

      // Reset button should not be visible after reset
      cy.contains('button', 'Reset Sort').should('not.exist')

      // Light arrows should be back
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')
    })
  })

  it('Tasks table sorting works', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Tasks').click()

      // Before sorting, light arrows should be visible
      cy.get('.tasks-table thead th')
        .contains('ServiceName')
        .parent()
        .find('svg')
        .should('exist')

      // Click the ServiceName header to sort
      cy.get('.tasks-table thead th').contains('ServiceName').click()

      // Verify sort indicator appears
      cy.get('.tasks-table thead th')
        .contains('ServiceName')
        .parent()
        .find('svg')
        .should('exist')

      // Click again to reverse sort
      cy.get('.tasks-table thead th').contains('ServiceName').click()

      // Verify sort indicator still appears
      cy.get('.tasks-table thead th')
        .contains('ServiceName')
        .parent()
        .find('svg')
        .should('exist')

      // Reset button should be visible
      cy.contains('button', 'Reset Sort').should('be.visible')

      // Click reset button
      cy.contains('button', 'Reset Sort').click()

      // Reset button should not be visible after reset
      cy.contains('button', 'Reset Sort').should('not.exist')
    })
  })

  it('Ports table sorting works', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Ports').click()

      // Before sorting, light arrows should be visible
      cy.get('#portsTable thead th')
        .contains('PublishedPort')
        .parent()
        .find('svg')
        .should('exist')

      // Click the PublishedPort header to sort
      cy.get('#portsTable thead th').contains('PublishedPort').click()

      // Verify sort indicator appears
      cy.get('#portsTable thead th')
        .contains('PublishedPort')
        .parent()
        .find('svg')
        .should('exist')

      // Click again to reverse sort
      cy.get('#portsTable thead th').contains('PublishedPort').click()

      // Verify sort indicator still appears
      cy.get('#portsTable thead th')
        .contains('PublishedPort')
        .parent()
        .find('svg')
        .should('exist')

      // Reset button should be visible
      cy.contains('button', 'Reset Sort').should('be.visible')

      // Click reset button
      cy.contains('button', 'Reset Sort').click()

      // Reset button should not be visible after reset
      cy.contains('button', 'Reset Sort').should('not.exist')
    })
  })

  it('Sort state persists in URL hash', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Nodes').click()

      // Click to sort by Hostname
      cy.get('#nodes-table thead th').contains('Node').click()

      // Check that the URL contains the sort information
      cy.url().should('include', 'SortBy')
      cy.url().should('include', 'SortDirection')

      // Reload the page
      cy.reload()

      // Verify sort indicator is still present after reload
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')

      // Reset button should still be visible
      cy.contains('button', 'Reset Sort').should('be.visible')
    })
  })
})
