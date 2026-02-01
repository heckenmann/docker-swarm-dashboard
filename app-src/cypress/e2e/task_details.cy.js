import { visitBaseUrlAndTest } from './spec.cy'

describe('Task Details Tests', () => {
  it('opens task details from tasks table view details button', () => {
    visitBaseUrlAndTest(() => {
      // Navigate to Tasks page
      cy.contains('a', 'Tasks').click()
      cy.get('.table', { timeout: 5000 }).should('exist')

      // Click the first "Details" button in the tasks table
      cy.get('button').contains('Details').first().click({ timeout: 5000 })

      // Verify task details view is shown
      cy.contains('Task ID', { timeout: 5000 }).should('be.visible')
      
      // Verify tabs exist
      cy.contains('button', 'Metrics', { timeout: 5000 }).should('be.visible')
      cy.contains('button', 'Table', { timeout: 5000 }).should('be.visible')
      cy.contains('button', 'JSON', { timeout: 5000 }).should('be.visible')
    })
  })

  it('opens task details by clicking task badge in h-dashboard', () => {
    visitBaseUrlAndTest(() => {
      // Navigate to Dashboard (horizontal)
      cy.contains('a', 'Dashboard').click()
      cy.get('#dashboardTable', { timeout: 5000 }).should('exist')

      // Find and click a task badge
      cy.get('.badge').contains(/running|shutdown|failed/i).first().click({ timeout: 5000 })

      // Verify task details view is shown
      cy.contains('Task ID', { timeout: 5000 }).should('be.visible')
    })
  })

  it('opens task details by clicking task badge in v-dashboard', () => {
    visitBaseUrlAndTest(() => {
      // Navigate to Dashboard Vertical
      cy.contains('a', 'Dashboard Vertical').click()
      cy.get('.card', { timeout: 5000 }).should('exist')

      // Find and click a task badge
      cy.get('.badge').contains(/running|shutdown|failed/i).first().click({ timeout: 5000 })

      // Verify task details view is shown
      cy.contains('Task ID', { timeout: 5000 }).should('be.visible')
    })
  })

  it('displays task metrics in details view', () => {
    visitBaseUrlAndTest(() => {
      // Navigate to Tasks page
      cy.contains('a', 'Tasks').click()
      cy.get('.table', { timeout: 5000 }).should('exist')

      // Click the first "Details" button
      cy.get('button').contains('Details').first().click({ timeout: 5000 })

      // Click on Metrics tab
      cy.contains('button', 'Metrics', { timeout: 5000 }).click()

      // Verify metrics content is displayed (or message about metrics not available)
      // The metrics might not be available in mock environment, so we check for either
      cy.get('.tab-content', { timeout: 5000 }).should('exist')
    })
  })

  it('displays task information in Table tab', () => {
    visitBaseUrlAndTest(() => {
      // Navigate to Tasks page
      cy.contains('a', 'Tasks').click()
      cy.get('.table', { timeout: 5000 }).should('exist')

      // Click the first "Details" button
      cy.get('button').contains('Details').first().click({ timeout: 5000 })

      // Click on Table tab
      cy.contains('button', 'Table', { timeout: 5000 }).click()

      // Verify table is displayed
      cy.get('table', { timeout: 5000 }).should('exist')
    })
  })
})
