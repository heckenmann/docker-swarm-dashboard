import BasePage from '../../support/pageObjects/BasePage'

const network = {
  network: {
    Id: 'shared',
    Name: 'shared-overlay',
    Driver: 'overlay',
    Scope: 'swarm',
    Ingress: false,
    Internal: false,
    Attachable: true,
    Labels: { 'com.docker.stack.namespace': 'demo' },
    IPAM: { Config: [{ Subnet: '10.0.0.0/24', Gateway: '10.0.0.1' }] },
    Options: { encrypted: '' },
  },
  missing: false,
  services: [
    {
      id: 's1',
      name: 'web',
      stack: 'demo',
      aliases: ['api'],
      endpointMode: 'vip',
      virtualIPs: ['10.0.0.2/24'],
      ports: [
        {
          PublishedPort: 8080,
          TargetPort: 80,
          Protocol: 'tcp',
          PublishMode: 'ingress',
        },
      ],
    },
    {
      id: 's2',
      name: 'worker',
      stack: '',
      aliases: [],
      endpointMode: 'dnsrr',
      virtualIPs: [],
      ports: [],
    },
  ],
}
const observation =
  'Daemon-local observations may omit remote endpoints and do not prove end-to-end connectivity.'
describe('Read-only network inventory', () => {
  let autoVisit
  before(() => {
    autoVisit = Cypress.config('autoVisit')
    Cypress.config('autoVisit', false)
  })
  after(() => Cypress.config('autoVisit', autoVisit))
  it('opens details, refreshes and links services, stacks and ports', () => {
    cy.intercept('GET', '**/docker/networks', {
      networks: [
        network,
        {
          network: { Id: 'gone', Name: 'removed' },
          missing: true,
          services: [],
        },
      ],
      observation,
    }).as('networks')
    cy.intercept('GET', '**/ui/ports', [
      {
        PublishedPort: 8080,
        TargetPort: 80,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceID: 's1',
        ServiceName: 'web',
        Stack: 'demo',
      },
    ])
    cy.intercept('GET', '**/docker/services/s1', {
      service: {
        ID: 's1',
        Spec: {
          Name: 'web',
          TaskTemplate: { Networks: [{ Target: 'shared', Aliases: ['api'] }] },
        },
      },
      tasks: [],
    })
    cy.intercept('GET', '**/docker/services/s1/metrics', { available: false })
    cy.intercept('GET', '**/docker/networks/shared', {
      ...network,
      observation,
    }).as('detail')
    const page = new BasePage()
    page.visitBaseUrl().navigateTo('Networks')
    cy.wait('@networks')
    cy.contains('Missing').should('be.visible')
    cy.get('[aria-label="Filter networks by"]').should('not.exist')
    cy.get('[title="Open network: shared-overlay"]').click()
    cy.wait('@detail')
    cy.location('hash').should('contain', 'networksDetail')
    cy.contains('api').should('be.visible')
    cy.contains('dnsrr').should('be.visible')

    cy.get('table[aria-label="IP address management"]')
      .contains('10.0.0.0/24')
      .should('be.visible')

    cy.get('[title="Open service: web"]').should('be.visible')
    cy.get('[title="Open service: worker"]').should('be.visible')
    cy.get('[title="Open service: web"]').click()
    cy.location('hash').should('contain', 'servicesDetail')
    cy.get('[title="Open network: shared"]').click()
    cy.wait('@detail')
    cy.location('hash').should('contain', 'networksDetail')
    cy.reload()
    cy.wait('@detail')
    cy.window().then((win) => {
      const hash = new URLSearchParams(win.location.hash.slice(1))
      hash.set('serviceNameFilter', JSON.stringify('stale-service'))
      hash.set('stackNameFilter', JSON.stringify('stale-stack'))
      win.location.hash = hash.toString()
    })
    cy.get('[title^="Open ports: 8080"]').click()
    cy.location('hash').should('contain', 'ports')
    cy.get('[aria-label="Filter by service name"]').should('have.value', 'web')
    cy.get('table tbody')
      .should('contain.text', '8080')
      .and('contain.text', 'web')
    page.navigateTo('Networks')
    cy.get('[title="Open network: shared-overlay"]').click()
    cy.get('[title="Filter stack: demo"]').first().click()
    cy.location('hash').should('contain', 'stacks')
  })
  it('shows a failure instead of an empty inventory', () => {
    cy.intercept('GET', '**/docker/networks', {
      statusCode: 503,
      body: 'Unavailable',
    })
    new BasePage().visitBaseUrl().navigateTo('Networks')
    cy.contains('Failed to load networks').should('be.visible')
    cy.contains('No networks.').should('not.exist')
  })
  for (const theme of ['light', 'dark']) {
    for (const width of [1440, 390]) {
      it(`keeps tables and icons consistent at ${width}px in ${theme} mode`, () => {
        cy.viewport(width, 900)
        cy.intercept('GET', '**/docker/networks', {
          networks: [network],
          observation,
        })
        cy.intercept('GET', '**/docker/networks/shared', {
          ...network,
          observation,
        })
        cy.visit(
          '/#base=http%3A%2F%2Flocalhost%3A3001%2F&darkMode=' +
            (theme === 'dark') +
            '&view=' +
            encodeURIComponent(JSON.stringify({ id: 'networks' })),
        )
        cy.get('a[aria-label="Networks"] svg').should(
          'have.attr',
          'data-icon',
          'network-wired',
        )
        cy.get('a[aria-label="Nodes"] svg').should(
          'have.attr',
          'data-icon',
          'server',
        )
        cy.get('table[aria-label="Networks"]')
          .should('have.class', 'table-sm')
          .and('have.class', 'table-' + theme)
        cy.get('table[aria-label="Networks"]')
          .closest('.card-body')
          .should('not.exist')
        cy.get('table[aria-label="Networks"] th').should('have.length', 10)
        cy.get('th[aria-label^="Sort by Name,"]')
          .click()
          .should('have.attr', 'aria-sort', 'ascending')
        cy.get('th[aria-label^="Sort by Name,"]')
          .type('{enter}')
          .should('have.attr', 'aria-sort', 'descending')
        cy.document().then((doc) =>
          expect(doc.documentElement.scrollWidth).to.be.at.most(width),
        )
        cy.get('[title="Open network: shared-overlay"]').click()
        cy.get('[role="tab"]').should('not.exist')
        cy.contains('button', 'All networks').should('not.exist')
        cy.get('table').should('have.length', 7)
        cy.get('table').each(($table) => {
          expect($table.closest('.card').children('.card-body')).to.have.length(
            0,
          )
        })
        cy.contains('.card-header', 'Raw JSON').should('be.visible')
        cy.get('[aria-label="Code language"]').should('not.exist')
        cy.get('[aria-label="Copy config content"]').should('not.exist')
        cy.get('pre code').should('exist')
        cy.contains('strong', 'Network "shared-overlay"').should('be.visible')

        cy.get('table[aria-label="IP address management"]').should(
          'have.class',
          'table-sm',
        )
        cy.get('table[aria-label="IP address management"]')
          .contains('10.0.0.1')
          .should('be.visible')

        cy.contains('No peers reported').should('be.visible')
        cy.document().then((doc) =>
          expect(doc.documentElement.scrollWidth).to.be.at.most(width),
        )
      })
    }
  }
})
