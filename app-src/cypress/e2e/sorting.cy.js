import { visitBaseUrlAndTest } from './spec.cy'

describe('Table Sorting Tests', () => {
  it('Nodes table sorting works', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Nodes').click()
      
      // Click the Node header to sort
      cy.get('#nodes-table thead th').contains('Node').click()
      
      // Verify sort indicator appears
      cy.get('#nodes-table thead th').contains('Node').parent().find('svg').should('exist')
      
      // Click again to reverse sort
      cy.get('#nodes-table thead th').contains('Node').click()
      
      // Verify sort indicator still appears (direction changed)
      cy.get('#nodes-table thead th').contains('Node').parent().find('svg').should('exist')
    })
  })

  it('Tasks table sorting works', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Tasks').click()
      
      // Click the ServiceName header to sort
      cy.get('.tasks-table thead th').contains('ServiceName').click()
      
      // Verify sort indicator appears
      cy.get('.tasks-table thead th').contains('ServiceName').parent().find('svg').should('exist')
      
      // Click again to reverse sort
      cy.get('.tasks-table thead th').contains('ServiceName').click()
      
      // Verify sort indicator still appears
      cy.get('.tasks-table thead th').contains('ServiceName').parent().find('svg').should('exist')
    })
  })

  it('Ports table sorting works', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Ports').click()
      
      // Click the PublishedPort header to sort
      cy.get('#portsTable thead th').contains('PublishedPort').click()
      
      // Verify sort indicator appears
      cy.get('#portsTable thead th').contains('PublishedPort').parent().find('svg').should('exist')
      
      // Click again to reverse sort
      cy.get('#portsTable thead th').contains('PublishedPort').click()
      
      // Verify sort indicator still appears
      cy.get('#portsTable thead th').contains('PublishedPort').parent().find('svg').should('exist')
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
      cy.get('#nodes-table thead th').contains('Node').parent().find('svg').should('exist')
    })
  })
})
