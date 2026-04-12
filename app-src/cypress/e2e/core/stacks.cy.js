import StacksPage from '../../support/pageObjects/StacksPage'

describe('Stacks Tests', () => {
  const stacksPage = new StacksPage();

  beforeEach(() => {
    stacksPage.visit();
  });

  it('Load page', () => {
    stacksPage
      .assertStackRowVisible('docker-swarm-dashboard')
      .assertStackHeaderVisible('dsd');
  });
});
