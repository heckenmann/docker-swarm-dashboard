import BasePage from '../../support/pageObjects/BasePage'

describe('MCP connection page', () => {
  const basePage = new BasePage()
  let autoVisit

  before(() => {
    autoVisit = Cypress.config('autoVisit')
    Cypress.config('autoVisit', false)
  })

  after(() => {
    Cypress.config('autoVisit', autoVisit)
  })

  it('shows the MCP connection details when MCP is enabled', () => {
    basePage.visitBaseUrl()
    basePage.navigateTo('MCP')

    cy.contains('strong', 'MCP').should('be.visible')
    cy.contains('code', 'docker-swarm-dashboard').should('be.visible')
    cy.contains('code', 'Streamable HTTP').should('be.visible')
    cy.location('origin').then((origin) => {
      cy.get('input[aria-label="MCP URL"]').should('have.value', `${origin}/mcp`)
    })
    cy.get('button[aria-label="Copy MCP URL"]').should('be.visible')
    basePage.assertNoConsoleErrors()
  })

  it('uses the server path prefix and copies the connection URL', () => {
    cy.intercept('GET', '**/ui/dashboard-settings', (req) => {
      req.continue((res) => {
        res.body = {
          ...res.body,
          mcpEnabled: true,
          pathPrefix: '/docker-dashboard',
        }
      })
    }).as('prefixedSettings')
    basePage.visitBaseUrl()
    cy.wait('@prefixedSettings')
    basePage.navigateTo('MCP')
    cy.window().then((win) => {
      const writeText = cy.stub().resolves().as('copyMcpUrl')
      Object.defineProperty(win.navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      })
      cy.get('input[aria-label="MCP URL"]').should(
        'have.value',
        `${win.location.origin}/docker-dashboard/mcp`,
      )
      cy.get('button[aria-label="Copy MCP URL"]').click()
      cy.get('@copyMcpUrl').should(
        'have.been.calledWith',
        `${win.location.origin}/docker-dashboard/mcp`,
      )
    })
    cy.get('[role="status"]').should('contain.text', 'Copied')
  })

  it('hides MCP navigation when the server reports MCP disabled', () => {
    cy.intercept('GET', '**/ui/dashboard-settings', (req) => {
      req.continue((res) => {
        res.body = { ...res.body, mcpEnabled: false }
      })
    }).as('dashboardSettingsWithoutMCP')

    basePage.visitBaseUrl()
    cy.wait('@dashboardSettingsWithoutMCP')
    cy.get('a[aria-label="MCP"]').should('not.exist')
  })
})
