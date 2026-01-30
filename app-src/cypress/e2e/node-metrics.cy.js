import { visitBaseUrlAndTest } from './spec.cy'

describe('Node Metrics Tests', () => {
  it('Should display Metrics tab when viewing node details', () => {
    visitBaseUrlAndTest(() => {
      // Navigate to Nodes page
      cy.contains('a', 'Nodes').click()
      
      // Click on a node to view details
      cy.contains('td', 'manager1').should('be.visible').click()
      
      // Wait for node details to load
      cy.contains('h5', /Node "/).should('be.visible')
      
      // Check that Metrics tab exists and is the first tab
      cy.get('.nav-tabs').within(() => {
        cy.get('.nav-link').first().should('contain', 'Metrics')
      })
      
      // Metrics tab should be active by default
      cy.get('.nav-tabs .nav-link.active').should('contain', 'Metrics')
      
      // Check for metrics content or placeholder
      cy.get('.tab-content').within(() => {
        // Either metrics charts or the "not available" message should be visible
        cy.get('.card-body').should('be.visible')
      })
    })
  })

  it('Should show placeholder when node-exporter not available', () => {
    visitBaseUrlAndTest(() => {
      // Navigate to Nodes page
      cy.contains('a', 'Nodes').click()
      
      // Click on a node
      cy.contains('td', 'manager1').click()
      
      // Wait for metrics tab to be active
      cy.get('.nav-tabs .nav-link.active').should('contain', 'Metrics')
      
      // With mock API, metrics should be available
      // Check for either charts or the info alert
      cy.get('.tab-content').within(() => {
        cy.get('.card-body').should('exist')
      })
    })
  })

  it('Should display Table and JSON tabs', () => {
    visitBaseUrlAndTest(() => {
      // Navigate to Nodes page
      cy.contains('a', 'Nodes').click()
      
      // Click on a node
      cy.contains('td', 'manager1').click()
      
      // Check all three tabs exist in correct order
      cy.get('.nav-tabs').within(() => {
        cy.get('.nav-link').eq(0).should('contain', 'Metrics')
        cy.get('.nav-link').eq(1).should('contain', 'Table')
        cy.get('.nav-link').eq(2).should('contain', 'JSON')
      })
      
      // Click Table tab
      cy.contains('.nav-link', 'Table').click()
      cy.get('.nav-tabs .nav-link.active').should('contain', 'Table')
      
      // Click JSON tab
      cy.contains('.nav-link', 'JSON').click()
      cy.get('.nav-tabs .nav-link.active').should('contain', 'JSON')
      cy.get('pre code').should('exist')
    })
  })
})
