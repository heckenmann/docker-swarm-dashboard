import DashboardPage from '../../support/pageObjects/DashboardPage'

describe('Dashboard vertical Tests', () => {
  const dashboardPage = new DashboardPage();

  beforeEach(() => {
    dashboardPage.visitVertical();
  });

  it('Load page', () => {
    cy.contains('td', 'backend_auth-service').click();
    cy.contains('th', 'manager1').should('exist');
  });

  it('Filter by service name', () => {
    cy.contains('td', 'backend_auth-service').should('exist');
    cy.contains('td', 'frontend_user-service').should('exist');
    
    dashboardPage.filterByServiceName('backend_');
    cy.contains('td', 'backend_auth-service').should('exist');
  });

  it('Filter by stack name', () => {
    dashboardPage.filterByStackName('frontend');
    cy.contains('td', 'frontend_user-service').should('exist');
  });
});
