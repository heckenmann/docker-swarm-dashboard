describe('UI Tests', () => {
  it('Timeline', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Timeline').click()
    })
  })

  it('Stacks', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Stacks').click()
      cy.contains('td', 'docker-swarm-dashboard')
      cy.contains('h5', 'dsd').click()
    })
  })

  it('Nodes', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'manager1').click()
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'manager2').click()
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'manager3').click()
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'worker1').click()
      cy.contains('a', 'Nodes').click()
      cy.contains('td', 'worker2').click()
    })
  })

  it('Tasks', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Tasks').click()
    })
  })

  it('Ports', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Ports').click()
      cy.contains('td', '8080')
      cy.contains('td', 'dsd_docker-swarm-dashboard')
    })
  })

  it('About', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'About').click()
      cy.document().its('body').should('contain', 'Docker Swarm Dashboard')
    })
  })

  it('Settings', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Settings').click()
      cy.get('input:eq(1)').click()
      cy.get('input:eq(2)').click()
    })
  })

  it('Dashboard horizontal', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.contains('button', 'manager1').click()
      cy.contains('button', 'JSON').click()
      cy.contains('a', 'Dashboard').click()
      cy.contains('button', 'manager2').click()
      cy.contains('button', 'JSON').click()
      cy.contains('a', 'Dashboard').click()
      cy.contains('button', 'manager3').click()
      cy.contains('button', 'JSON').click()
      cy.contains('a', 'Dashboard').click()
      cy.contains('div', 'dsd_docker-swarm-dashboard').click()
      cy.contains('button', 'JSON').click()
      cy.contains('button', 'Table').click()
    })
  })

  it('Dashboard vertical', () => {
    visitBaseUrlAndTest(() => {
      cy.contains('a', 'Dashboard').click()
      cy.get('main button:eq(1)').click()
      cy.contains('td', 'dsd_docker-swarm-dashboard').click()
      cy.contains('a', 'Dashboard').click()
      cy.get('main button:eq(1)').click()
      cy.contains('th', 'manager1').click()
    })
  })
})

function visitBaseUrlAndTest(fn) {
  const baseUrl =
    'http://localhost:3000#base="http%3A%2F%2Flocalhost%3A3001%2F"'
  cy.viewport(1920, 1080)
  cy.visit(baseUrl)

  fn()

  cy.window().then((win) => {
    // Prüfe auf Fehler in der Konsole
    const consoleErrors = win.console.error
    expect(consoleErrors.length).to.eq(
      0,
      `Error found in console: ${consoleErrors}`,
    )
  })

  cy.document().its('body').should('not.contain', 'ERROR')
}
