import BasePage from '../../support/pageObjects/BasePage'
import DashboardPage from '../../support/pageObjects/DashboardPage'

describe('Navigation Tests', () => {
  const basePage = new BasePage()
  const dashboardPage = new DashboardPage()

  beforeEach(() => {
    basePage.visitBaseUrl()
  })

  it('should navigate to all main pages', () => {
    // Test navigation to Dashboard Horizontal
    basePage.navigateTo('Dashboard').assertNoConsoleErrors()
    
    // Test navigation to Timeline
    basePage.navigateTo('Timeline').assertNoConsoleErrors()
    
    // Test navigation to Stacks
    basePage.navigateTo('Stacks').assertNoConsoleErrors()
    
    // Test navigation to Nodes
    basePage.navigateTo('Nodes').assertNoConsoleErrors()
    
    // Test navigation to Tasks
    basePage.navigateTo('Tasks').assertNoConsoleErrors()
    
    // Test navigation to Ports
    basePage.navigateTo('Ports').assertNoConsoleErrors()
    
    // Test navigation to Logs
    basePage.navigateTo('Logs').assertNoConsoleErrors()
    
    // Test navigation to About
    basePage.navigateTo('About').assertNoConsoleErrors()
    
    // Test navigation to Settings
    basePage.navigateTo('Settings').assertNoConsoleErrors()
  })

  it('should maintain state when navigating between pages', () => {
    // Navigate to dashboard and verify using POM
    dashboardPage.visitHorizontal()
    dashboardPage.assertIsHorizontal()
    
    // Navigate to Timeline and back to Dashboard
    basePage.navigateTo('Timeline')
    basePage.navigateTo('Dashboard')
    dashboardPage.assertIsHorizontal()
    
    // Navigate to Settings
    basePage.navigateTo('Settings')
  })
})