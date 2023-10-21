describe('template spec', () => {
  it('passes', () => {
    cy.viewport(1920, 1080)
    cy.visit('http://localhost:3000#base="http%3A%2F%2Flocalhost%3A3001%2F"')
    cy.document().its('body').should('not.contain', 'ERROR')

    // Timeline
    cy.contains('a', 'Timeline').click()

    // Stacks
    cy.contains('a', 'Stacks').click()
    cy.contains('td', 'docker-swarm-dashboard')
    cy.contains('h5', 'dsd').click()

    // Nodes
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

    // Tasks
    cy.contains('a', 'Tasks').click()

    // Ports
    cy.contains('a', 'Ports').click()
    cy.contains('td', '8080')
    cy.contains('td', 'dsd_docker-swarm-dashboard')

    // About
    cy.contains('a', 'About').click()
    cy.document().its('body').should('contain', 'Docker Swarm Dashboard')

    // Settings
    cy.contains('a', 'Settings').click()
    cy.get('input:eq(1)').click()
    cy.get('input:eq(2)').click()

    // Dashboard horizontal
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

    // Dashboard vertical
    cy.contains('a', 'Dashboard').click()
    cy.get('main button:eq(1)').click()
    cy.contains('td', 'dsd_docker-swarm-dashboard').click()
    cy.contains('a', 'Dashboard').click()
    cy.get('main button:eq(1)').click()
    cy.contains('th', 'manager1').click()
  })
})
