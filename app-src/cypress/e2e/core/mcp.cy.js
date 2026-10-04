import BasePage from '../../support/pageObjects/BasePage'
import { CY_BASE_URL } from '../../support/constants'

describe('MCP connection page', () => {
  const basePage = new BasePage()

  beforeEach(() => {
    basePage.visitBaseUrl()
  })

  it('shows the MCP connection details when MCP is enabled', () => {
    basePage.navigateTo('MCP')

    cy.contains('strong', 'MCP').should('be.visible')
    cy.contains('code', 'docker-swarm-dashboard').should('be.visible')
    cy.contains('code', 'Streamable HTTP').should('be.visible')
    cy.get('input[aria-label="MCP URL"]')
      .invoke('val')
      .should('match', /\/mcp$/)
    cy.get('button[aria-label="Copy MCP URL"]').should('be.visible')
    basePage.assertNoConsoleErrors()
  })

  it('hides MCP navigation when the server reports MCP disabled', () => {
    cy.intercept('GET', '**/ui/dashboard-settings', (req) => {
      req.continue((res) => {
        res.body = { ...res.body, mcpEnabled: false }
      })
    }).as('dashboardSettingsWithoutMCP')

    cy.visit(CY_BASE_URL)
    cy.wait('@dashboardSettingsWithoutMCP')
    cy.get('a[aria-label="MCP"]').should('not.exist')
  })
})
