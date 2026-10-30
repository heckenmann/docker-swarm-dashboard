import NodesPage from '../../support/pageObjects/NodesPage'

describe('Nodes Tests', () => {
  const nodesPage = new NodesPage();

  const health = (overrides = {}) => ({
    available: true, observedAt: new Date().toISOString(), state: 'observed',
    managers: 3, reachable: 3, unreachable: 0, unknown: 0, majority: 2,
    remainingFailures: 1, leaderIds: [], warnings: [], nodes: [], ...overrides,
  });

  beforeEach(() => {
    cy.intercept('GET', '**/docker/cluster/health', health()).as('getClusterHealth');
    // Intercept cluster metrics API call
    cy.intercept('GET', '**/docker/nodes/metrics', {
      available: true,
      totalCpu: 20,
      totalMemory: 42949672960,
      usedMemory: 21474836480,
      memoryPercent: 50.0,
      totalDisk: 536870912000,
      usedDisk: 268435456000,
      diskPercent: 50.0,
      nodeCount: 5,
      nodesAvailable: 5
    }).as('getClusterMetrics');
    
    // Intercept individual node metrics for resource bars
    cy.intercept('GET', '**/docker/nodes/*/metrics', {
      available: true,
      metrics: {
        memory: {
          total: 8589934592,
          available: 4294967296
        },
        filesystem: [
          {
            mountpoint: '/',
            size: 107374182400,
            used: 53687091200
          }
        ]
      }
    }).as('getNodeMetrics');
    
    nodesPage.visit();
  });

  it('Load page', () => {
    nodesPage
      .clickNodeRow('manager1')
      .assertNodeExists('manager2')
      .assertNodeExists('worker1');
  });

  it('Displays cluster-wide metrics', () => {
    cy.wait('@getClusterMetrics');
    nodesPage
      .assertClusterMetricsVisible()
      .assertClusterCpuCores('20');
  });

  it('Displays memory and disk resource bars for each node', () => {
    cy.wait('@getClusterMetrics');
    // Wait for at least one node metrics call
    cy.wait('@getNodeMetrics');
    
    // Verify the table headers exist
    cy.contains('th', 'Memory').should('be.visible');
    cy.contains('th', 'Disk').should('be.visible');
    
    // Verify at least one progress bar is rendered in the table
    cy.get('#nodes-table tbody tr').first().within(() => {
      cy.get('[role="progressbar"]').should('have.length.at.least', 1);
    });
  });
  it('Shows manager health without node-exporter metrics', () => {
    cy.intercept('GET', '**/docker/nodes/metrics', {available:false});
    cy.reload();
    nodesPage.visit();
    cy.contains('Cluster Overview').should('be.visible');
    cy.get('[aria-label="Manager quorum"]').should('contain','3 / 2');
    cy.get('[aria-label="Manager failure reserve"]').should('contain','1');
    cy.contains('summary','Cluster resources unavailable').click();
    cy.contains('Cluster-wide metrics are not enabled').should('be.visible');
  });

  it('Shows affected node links, versions and a reduced failure reserve', () => {
    cy.request('http://localhost:3001/ui/nodes').then(({body}) => {
      const node = body[0];
      cy.intercept('GET', '**/docker/cluster/health', health({
        state:'warning',reachable:2,unreachable:1,remainingFailures:0,
        nodes:[{id:node.ID,hostname:node.Hostname}],
        warnings:[{code:'unreachable_managers',message:'A manager is unreachable.',nodeIds:[node.ID]}],
      }));
      cy.intercept('GET','**/ui/nodes',body.map(item => ({...item,EngineVersion:'28.5.2',OS:'linux',Architecture:'arm64'})));
      cy.reload();
      nodesPage.visit();
      cy.get('[aria-label="Manager failure reserve"]').should('contain','0');
      cy.contains('#nodes-table td','linux / arm64').should('be.visible');
      cy.contains('#nodes-table td','28.5.2').should('be.visible');
      cy.contains('[role="alert"]','A manager is unreachable.').within(() => {
        cy.contains(node.Hostname).should('be.visible');
        cy.contains('button',node.Hostname).click();
      });
      cy.contains(`Node "${node.Hostname}"`).should('be.visible');
    });
  });

  it('Keeps the health card visible when Docker queries fail', () => {
    cy.intercept('GET','**/docker/cluster/health',{statusCode:503,body:{available:false,state:'unavailable'}});
    cy.intercept('GET','**/ui/nodes',{statusCode:500,body:'Docker unavailable'});
    cy.reload();
    nodesPage.visit();
    cy.contains('Control-plane information is unavailable').should('be.visible');
    cy.contains('Node inventory is unavailable').should('be.visible');
    cy.contains('Majority observed reachable').should('not.exist');
  });

  it('Groups control plane and resources into one overview and fits a mobile viewport', () => {
    cy.contains('.card','Cluster Overview').within(() => {
      cy.get('section[aria-label="Control plane"]').should('be.visible');
      cy.get('section[aria-label="Cluster resources"]').should('be.visible');
      cy.get('.card').should('not.exist');
    });
    cy.get('a[aria-label="Nodes"]').trigger('mouseout').blur();
    cy.viewport(390,844);
    cy.get('[aria-label="Manager failure reserve"]').should('be.visible');
    cy.document().should(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth));
  });

});