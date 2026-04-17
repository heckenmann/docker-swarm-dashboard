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
});
