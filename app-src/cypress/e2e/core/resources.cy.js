import BasePage from '../../support/pageObjects/BasePage'

const resource = (overrides = {}) => ({
  id: 'shared-resource',
  name: 'resource-v2',
  version: 3,
  created: '2026-01-01T00:00:00Z',
  updated: '2026-02-01T00:00:00Z',
  stack: 'demo',
  labels: { password: '********' },
  usage: 'referenced',
  consumers: [
    {
      serviceId: 'service1',
      serviceName: 'web',
      stack: 'demo',
      target: '/etc/web',
      uid: '1000',
      gid: '1001',
      mode: '0440',
    },
    {
      serviceId: 'service2',
      serviceName: 'worker',
      stack: 'other',
      target: '/etc/worker',
      uid: '0',
      gid: '0',
      mode: '0400',
    },
  ],
  ...overrides,
})

describe('Config and secret inventories', () => {
  const page = new BasePage()
  let autoVisit
  before(() => {
    autoVisit = Cypress.config('autoVisit')
    Cypress.config('autoVisit', false)
  })
  after(() => Cypress.config('autoVisit', autoVisit))
  for (const kind of ['configs', 'secrets']) {
    const title = kind === 'configs' ? 'Configs' : 'Secrets'
    it(`shows ${kind}, mount details, links and fresh usage`, () => {
      let data = {
        usageKnown: true,
        resources: [
          resource(),
          resource({
            id: 'old',
            name: 'old-resource',
            usage: 'unreferenced',
            consumers: [],
          }),
        ],
      }
      cy.intercept('GET', '**/docker/' + kind, (req) => req.reply(data)).as(
        'inventory',
      )
      cy.intercept('GET', '**/docker/configs/*', {
        ...resource(),
        content: { status: 'hidden' },
      })
      cy.intercept('GET', '**/docker/' + kind + '/*', (req) =>
        req.reply({
          ...data.resources.find((item) => req.url.endsWith('/' + item.id)),
          content: { status: 'hidden' },
        }),
      ).as('resourceDetail')
      page.visitBaseUrl().navigateTo(title)
      cy.wait('@inventory')
      cy.contains('strong', title).should('be.visible')
      cy.get('table')
        .first()
        .closest('.card')
        .children('.card-body')
        .should('not.exist')
      cy.contains('th', 'Name').click()
      cy.get('tbody tr').first().should('contain.text', 'old-resource')
      cy.contains('th', 'Name').click()
      cy.get('tbody tr').first().should('contain.text', 'resource-v2')
      cy.contains('th', 'Name').click()
      cy.get('[aria-label="Filter resource name or ID"]').should('not.exist')
      cy.contains('cleanup candidate').should('be.visible')
      cy.get(
        '[title="Open config: resource-v2"], [title="Open secret: resource-v2"]',
      ).click()
      cy.wait('@resourceDetail')
      cy.get('[aria-label="Filter resource name or ID"]').should('not.exist')
      cy.contains('/etc/web').should('be.visible')
      cy.contains('/etc/worker').should('be.visible')
      cy.location('hash').should('contain', kind + 'Detail')
      cy.reload()
      cy.wait('@resourceDetail')
      cy.contains('strong', 'resource-v2').should('be.visible')
      cy.contains('.card-header', 'resource-v2').find('svg').should('exist')
      cy.contains('.card-header', 'Consuming services and mounts')
        .find('svg')
        .should('exist')
      cy.get('[aria-label="Filter resource name or ID"]').should('not.exist')
      cy.contains('0440').should('be.visible')
      cy.get('[title="Open service: web"]').should('be.visible')
      cy.then(() => {
        data = {
          usageKnown: false,
          message: 'Service inventory unavailable; resource usage is unknown.',
          resources: [resource({ usage: 'unknown', consumers: [] })],
        }
      })
      // Returning to this inventory triggers the same refresh dependency as the navbar refresh.
      page.navigateTo('Stacks').navigateTo(title)
      cy.wait('@inventory')
      cy.contains('resource usage is unknown').should('be.visible')
      cy.contains('cleanup candidate').should('not.exist')
      cy.get(
        '[title="Open config: resource-v2"], [title="Open secret: resource-v2"]',
      ).click()
      cy.wait('@resourceDetail')
      cy.get('[aria-label="Filter resource name or ID"]').should('not.exist')
      cy.contains('Consuming services are unknown.').should('be.visible')
      cy.then(() => {
        data = { usageKnown: true, resources: [] }
      })
      page.navigateTo('Stacks').navigateTo(title)
      cy.wait('@inventory')
      cy.contains('No ' + kind).should('be.visible')
      page.assertNoConsoleErrors()
    })
  }
})

describe('Config content detail visibility', () => {
  const page = new BasePage()
  let autoVisit
  before(() => {
    autoVisit = Cypress.config('autoVisit')
    Cypress.config('autoVisit', false)
  })
  after(() => Cypress.config('autoVisit', autoVisit))
  it('renders complete content as text and removes it when server visibility changes', () => {
    const value =
      '<script>example</script>\nPASSWORD=example-value\nsecond line\n'
    let content = { status: 'available', encoding: 'utf-8', value }
    cy.intercept('GET', '**/docker/configs', {
      usageKnown: true,
      resources: [resource()],
    })
    cy.intercept('GET', '**/docker/configs/shared-resource', (req) =>
      req.reply({ ...resource(), content }),
    ).as('configDetail')
    cy.viewport(1280, 700)
    page.visitBaseUrl().navigateTo('Configs')
    cy.get(
      '[title="Open config: resource-v2"], [title="Open secret: resource-v2"]',
    ).click()
    cy.wait('@configDetail')
    cy.get('section[aria-label="Config content"] pre code').should(($code) => {
      expect($code.text()).to.equal(value)
    })
    cy.get('section[aria-label="Config content"] script').should('not.exist')
    cy.get('[aria-label="Code language"]').select('markup')
    cy.screenshot('config-detail-code-field', { capture: 'viewport' })
    cy.then(() => {
      content = { status: 'hidden' }
    })
    page.navigateTo('Configs')
    cy.get(
      '[title="Open config: resource-v2"], [title="Open secret: resource-v2"]',
    ).click()
    cy.wait('@configDetail')
    cy.contains('Set DSD_HIDE_CONFIG_CONTENT=false').should('be.visible')
    cy.get('section[aria-label="Config content"] pre').should('not.exist')
    page.assertNoConsoleErrors()
  })
})

describe('Service resource links', () => {
  const page = new BasePage()
  let autoVisit
  before(() => {
    autoVisit = Cypress.config('autoVisit')
    Cypress.config('autoVisit', false)
  })
  after(() => Cypress.config('autoVisit', autoVisit))
  for (const [title, kind, prefix] of [
    ['Configs', 'configs', 'Config'],
    ['Secrets', 'secrets', 'Secret'],
  ]) {
    it(`opens the linked ${kind} detail from a service`, () => {
      const id = kind + '-linked-id'
      const name = kind + '-linked-name'
      cy.intercept('GET', '**/docker/services/*', (req) =>
        req.continue((res) => {
          if (!res.body?.service) return
          res.body.service.Spec.TaskTemplate ??= {}
          res.body.service.Spec.TaskTemplate.ContainerSpec ??= {}
          res.body.service.Spec.TaskTemplate.ContainerSpec[title] = [
            {
              [prefix + 'ID']: id,
              [prefix + 'Name']: name,
              File: {
                Name: '/etc/linked-resource',
                UID: '1000',
                GID: '1000',
                Mode: 288,
              },
            },
          ]
        }),
      )
      cy.intercept('GET', '**/docker/' + kind, {
        usageKnown: true,
        resources: [resource({ id, name })],
      }).as('linkedInventory')
      cy.intercept('GET', '**/docker/' + kind + '/' + id, {
        ...resource({ id, name }),
        content: { status: 'hidden' },
      })
      page.visitBaseUrl().navigateTo('Dashboard')
      // Exercise navigation without fade timing: headless Electron can stall
      // CSS transitions. Visibility and the final detail destination are checked.
      cy.document().then((doc) => {
        const style = doc.createElement('style')
        style.textContent = '.tab-pane { transition: none !important; }'
        doc.head.appendChild(style)
      })
      cy.get('th .service-name-text')
        .first()
        .closest('th')
        .find('button.name-open-btn')
        .click()
      cy.contains('[role="tab"]', 'Resources')
        .click()
        .should('have.attr', 'aria-selected', 'true')
      cy.get('.tab-pane.active').should('have.css', 'opacity', '1')
      cy.get('.tab-pane.active table')
        .closest('.card')
        .children('.card-body')
        .should('not.exist')
      cy.get('.tab-pane.active')
        .contains('/etc/linked-resource')
        .should('be.visible')
      cy.get('.tab-pane.active')
        .contains('.card', `${title} in this Service`)
        .within(() => {
          cy.get('thead th').should('have.length', 6)
          cy.get('tbody tr').first().find('td').should('have.length', 6)
        })
      cy.viewport(1920, 1080)
      cy.screenshot(`service-${kind}-tables-wide`, { capture: 'viewport' })
      cy.viewport(390, 844)
      cy.screenshot(`service-${kind}-tables-mobile`, { capture: 'viewport' })
      cy.viewport(1280, 900)
      cy.get('.tab-pane.active')
        .find(
          `[title="Open ${kind === 'configs' ? 'config' : 'secret'}: ${name}"]`,
        )
        .click()
      cy.contains('strong', name).should('be.visible')
      cy.get('[aria-label="Filter resource name or ID"]').should('not.exist')
      cy.contains('strong', name).should('be.visible')
      cy.contains('code', id).should('be.visible')
      page.assertNoConsoleErrors()
    })
  }
})
