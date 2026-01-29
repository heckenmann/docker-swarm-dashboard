import { visitBaseUrlAndTest } from './spec.cy'

describe('Table Sorting Tests', () => {
  it('Nodes table has light arrows and sorting works with 3-click cycle', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Nodes').click()

      // Before sorting, light arrows should be visible on all headers
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')

      // First click: sort ascending
      cy.get('#nodes-table thead th').contains('Node').click()

      // Verify sort indicator appears (should be sort-up icon)
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')

      // Second click: sort descending
      cy.get('#nodes-table thead th').contains('Node').click()

      // Verify sort indicator still appears (should be sort-down icon)
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')

      // Third click: reset (should go back to light arrow)
      cy.get('#nodes-table thead th').contains('Node').click()

      // Verify light arrow is back
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')
    })
  })

  it('Tasks table sorting works with 3-click cycle', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Tasks').click()

      // Before sorting, light arrows should be visible
      cy.get('.tasks-table thead th')
        .contains('ServiceName')
        .parent()
        .find('svg')
        .should('exist')

      // Click the ServiceName header to sort ascending
      cy.get('.tasks-table thead th').contains('ServiceName').click()

      // Verify sort indicator appears
      cy.get('.tasks-table thead th')
        .contains('ServiceName')
        .parent()
        .find('svg')
        .should('exist')

      // Click again to sort descending
      cy.get('.tasks-table thead th').contains('ServiceName').click()

      // Verify sort indicator still appears
      cy.get('.tasks-table thead th')
        .contains('ServiceName')
        .parent()
        .find('svg')
        .should('exist')

      // Click third time to reset
      cy.get('.tasks-table thead th').contains('ServiceName').click()

      // Verify light arrow is back
      cy.get('.tasks-table thead th')
        .contains('ServiceName')
        .parent()
        .find('svg')
        .should('exist')
    })
  })

  it('Ports table sorting works with 3-click cycle', () => {
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

      // Click third time to reset
      cy.get('#portsTable thead th').contains('PublishedPort').click()

      // Verify light arrow is back
      cy.get('#portsTable thead th')
        .contains('PublishedPort')
        .parent()
        .find('svg')
        .should('exist')
    })
  })

  it('Sort state persists in URL hash', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Nodes').click()

      // Click to sort by Hostname
      cy.get('#nodes-table thead th').contains('Node').click()

      // Check that the URL contains the sort information
      cy.url().should('include', 'sortBy')
      cy.url().should('include', 'sortDirection')

      // Reload the page
      cy.reload()

      // Verify sort indicator is still present after reload
      cy.get('#nodes-table thead th')
        .contains('Node')
        .parent()
        .find('svg')
        .should('exist')
    })
  })
})
