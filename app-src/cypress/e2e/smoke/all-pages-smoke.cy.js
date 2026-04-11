
describe('All Pages Smoke Test', () => {
  it('should be able to navigate to all main pages without errors', () => {
    
      // Test navigation to all main pages
      const pages = [
        'Dashboard',
        'Timeline', 
        'Stacks',
        'Nodes',
        'Tasks',
        'Ports',
        'Logs',
        'About',
        'Settings'
      ]
      
      pages.forEach(page => {
        cy.log(`Navigating to ${page}`)
        cy.get(`a[aria-label="${page}"]`).click()
        cy.get('nav', { timeout: 5000 }).should('be.visible')
      })
    
  })

  it('should have all page objects accessible via getPage command', () => {
    const pageNames = [
      'base',
      'dashboard', 
      'settings',
      'nodes',
      'stacks',
      'tasks',
      'ports',
      'logs',
      'timeline',
      'about'
    ]
    
    pageNames.forEach(pageName => {
      cy.log(`Testing page object: ${pageName}`)
      cy.wrap(null).then(() => {
        const page = cy.getPage(pageName)
        expect(page).to.exist
      })
    })
  })
})