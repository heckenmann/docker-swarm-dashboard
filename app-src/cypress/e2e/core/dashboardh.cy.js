import DashboardPage from '../../support/pageObjects/DashboardPage'

describe('Dashboard horizontal Tests', () => {
  const dashboardPage = new DashboardPage();

  it('Dashboard horizontal', () => {
    dashboardPage
      .assertServiceExists('backend_auth-service')
      .assertManagerNodesExist(['manager1', 'manager2', 'manager3'])
      .clickServiceOpenButton('backend_auth-service');

    cy.contains('button', 'JSON', { timeout: 5000 }).should('be.visible');
    cy.contains('button', 'Table', { timeout: 5000 }).should('be.visible');
  });

  it('Filter by service name', () => {
    dashboardPage
      .filterByServiceName('backend_')
      .assertServiceExists('backend_auth-service');
      
    dashboardPage
      .filterByServiceName('frontend_')
      .assertServiceExists('frontend_user-service');
  });

  it('Filter by stack name', () => {
    dashboardPage
      .filterByStackName('backend')
      .assertServiceExists('backend_auth-service');
  });
});
