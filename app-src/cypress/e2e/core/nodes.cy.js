import NodesPage from '../../support/pageObjects/NodesPage'

describe('Nodes Tests', () => {
  const nodesPage = new NodesPage();

  beforeEach(() => {
    nodesPage.visit();
  });

  it('Load page', () => {
    nodesPage
      .clickNodeRow('manager1')
      .assertNodeExists('manager2')
      .assertNodeExists('worker1');
  });
});
