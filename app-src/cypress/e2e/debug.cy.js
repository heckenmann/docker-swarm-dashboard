import { visitBaseUrlAndTest } from './spec.cy'

// Timeout for async atom data to resolve via the mock API
const DATA_TIMEOUT = 10000

describe('Debug Tests', () => {
  it('Navigate to debug page via About button and verify content', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'About').click()

      // Wait for the About page to fully render before clicking Debug
      cy.contains('h1, h2, h3', 'Docker Swarm Dashboard').should('be.visible')

      // Click the Debug button on the About page
      cy.contains('button', 'Debug').should('be.visible').click()

      // All async atoms (dashboardHAtom, nodesAtom, versionAtom, …) must resolve
      // before the DebugComponent appears – use an explicit timeout accordingly.
      cy.contains('h1', 'Debug', { timeout: DATA_TIMEOUT }).should('be.visible')
      cy.contains('h2', 'API Dump').should('be.visible')

      // JSON dump should be rendered inside <pre><code>
      cy.get('pre code', { timeout: DATA_TIMEOUT }).should('be.visible')

      // Verify the JSON dump contains all expected top-level keys
      cy.get('pre code')
        .invoke('text')
        .then((text) => {
          const json = JSON.parse(text)
          expect(json).to.have.all.keys(
            'dashboardh',
            'dashboardv',
            'stacks',
            'nodes',
            'tasks',
            'ports',
            'services',
            'settings',
            'version',
          )
        })

      // version section should include the updateAvailable flag
      cy.get('pre code')
        .invoke('text')
        .then((text) => {
          const json = JSON.parse(text)
          expect(json.version).to.have.property('updateAvailable')
        })
    })
  })
})
