import NodesPage from '../../support/pageObjects/NodesPage'

describe('Nodes Tests', () => {
  const nodesPage = new NodesPage();

  beforeEach(() => {
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
});